"use strict";

const video = document.getElementById("sourceVideo");
// const videoCanvas = document.getElementById("processVideo");
let videoCap = null;
let videoMat = null;
let videoMatThresh = null;
let calculator = null;
let dim = null;

const FPS = 20; // Lower FPS to let Desmos plot better

await onInit();

async function onInit() {
    let panel = document.getElementById("main");
    calculator = Desmos.GraphingCalculator(panel, {
        expressions: false,
        lockViewport: true
    });

    console.log("Initialized main script!");

    document.addEventListener("click", async () => {
        await prepare();
    });
}

async function prepare() {
    if (isPlaying())
        return;

    try {
        await video.play();
    }
    catch (e) {
        console.error("Failed to load video! " + e)
    }

    dim = await getDimensions(video);
    video.height = dim.height; // ??? Why???
    video.width = dim.width;

    calculator.setMathBounds({
        left: 0,
        right: dim.width,
        bottom: 0,
        top: dim.height
    });

    videoCap = new cv.VideoCapture(video);
    videoMat = new cv.Mat(dim.height, dim.width, cv.CV_8UC4);
    videoMatThresh = new cv.Mat(dim.height, dim.width, cv.CV_8UC1);

    console.log("Ready to play!");
    processVideo(); // No await!
}

async function processVideo() {
    let begin = Date.now();

    // Loading frame
    videoCap.read(videoMat);
    cv.cvtColor(videoMat, videoMatThresh, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(videoMatThresh, videoMatThresh, 127, 255, cv.THRESH_BINARY);

    // Handling contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(videoMatThresh, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

    // Testing
    let outputMat = cv.Mat.zeros(videoMatThresh.rows, videoMatThresh.cols, cv.CV_8UC3);
    let color = new cv.Scalar(255, 255, 255);
    cv.drawContours(outputMat, contours, -1, color, 1, cv.LINE_8, hierarchy, 100);
    cv.imshow("processVideo", outputMat);
    outputMat.delete();

    // Clearing
    calculator.getExpressions().forEach(o => calculator.removeExpression({ id: o.id }));

    // Drawing
    for (let i = 0; i < contours.size(); ++i) {
        let c = contours.get(i);
        let indices = c.data32S.length;
        if (indices / 2 < 50)
            continue;
        // y_{1}\sim a_{k}x_{k}^{k}

        let colX = [];
        let colY = [];

        // Jump by 2 * skip, mainly so Desmos actually can draw it per frame
        for (let j = 0; j < indices; j += 2) {
            // partially stolen from the other Bad Apple in Minecraft demo; use the data structure with steps
            let x = c.data32S[j];
            let y = dim.height - c.data32S[j + 1];
            if (x === undefined || y === undefined)
                continue;
            colX.push("" + x);
            colY.push("" + y);
        }
        colX.push(colX[0]); // Handle ending point.
        colY.push(colY[0]);

        calculator.setExpression( {
            id: "t" + i,
            type: "table",
            columns: [{
                latex: "x",
                values: colX,
                color: Desmos.Colors.BLACK,
                points: false,
                lines: true
            }, {
                latex: "y",
                values: colY,
                color: Desmos.Colors.BLACK,
                points: false,
                lines: true
            }]
        })
    }

    // Cleanup
    contours.delete();
    hierarchy.delete();

    // Process again
    let delay = 1000 / FPS - (Date.now() - begin);
    setTimeout(processVideo, delay > 0 ? delay : 0);
}

async function getDimensions(video) {
    return new Promise((promise) => {
        if (video.videoWidth !== 0 && video.videoWidth !== undefined && video.videoHeight !== 0 && video.videoHeight !== undefined) { // If already set.
            promise({
                width : video.videoWidth,
                height : video.videoHeight
            });
        } else {
            video.addEventListener("loadeddata", () => { // We wait.
                promise({
                    width : video.videoWidth,
                    height : video.videoHeight
                });
            });
        }
    });
}

function isPlaying() {
    return !video.paused && !video.ended && video.currentTime > 0 && video.readyState > 2;
}