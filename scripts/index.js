
const URL = "https://teachablemachine.withgoogle.com/models/gXhkJzMo7/";
// "https://teachablemachine.withgoogle.com/models/dSNpDRKWU/";
    let model, webcam, ctx, labelContainer, maxPredictions;
    let countOutside = 0;
    let countOther = 0;
    let countNone = 0;
    labelContainer = document.getElementById("label-container");
    async function init() {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // load the model and metadata
        // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
        // Note: the pose library adds a tmPose object to your window (window.tmPose)
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Convenience function to setup a webcam
        const size = 200;
        const flip = true; // whether to flip the webcam
        webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        window.requestAnimationFrame(loop);

        // append/get elements to the DOM
        const canvas = document.getElementById("canvas");
        canvas.width = size; canvas.height = size;
        ctx = canvas.getContext("2d");
        
        for (let i = 0; i < maxPredictions; i++) { // and class labels
            labelContainer.appendChild(document.createElement("div"));
        }
    }
    // init();

    async function loop(timestamp) {
        webcam.update(); 
        await predict();
        window.requestAnimationFrame(loop);
    }

    async function predict() {
        // Prediction #1: run input through posenet
        // estimatePose can take in an image, video or canvas html element
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        // Prediction 2: run input through teachable machine classification model
        const prediction = await model.predict(posenetOutput);
        let maxPoint = 0;
        let maxName = "";
      
        for (let i = 0; i < maxPredictions; i++) {
            if(maxPoint < +prediction[i].probability.toFixed(2)){
                maxPoint = +prediction[i].probability.toFixed(2);
                maxName = prediction[i].className;
            }
            
            // const classPrediction =
            //     prediction[i].className + ": " + prediction[i].probability.toFixed(2);
            // labelContainer.childNodes[i].innerHTML = classPrediction;
        }
        setTimeout(()=>{
            if(maxName === "None"){
                labelContainer.innerHTML = `Warning: This exam will going to end, if you are not present in screen within 20 seconds!`;
                labelContainer.style.backgroundColor = "red";
                countNone++;
            }else if(maxName === "Outside"){
                labelContainer.innerHTML = `Please look into screen`;
                labelContainer.style.backgroundColor = "red";
                countOutside++;
            }else if(maxName === "Other"){
                labelContainer.innerHTML = `Warning: Someone is present in screen, please make sure you are only one in test!`;
                labelContainer.style.backgroundColor = "red";
                countOther++;
            }else{
                labelContainer.innerHTML = `Good`;
                labelContainer.style.backgroundColor = "green";
            }
            if(countNone === 5){
                setTimeout(()=>{
                    if(maxName === "None"){
                        window.location.reload();    
                    }
                }, 20000);
            }
            if(countOutside === 50){
                countOutside = 51;
                makeToast('we are giving you final warning, only look into screen otherwise test will be ended automatically.')
            }
            if(countOutside === 200 || countOther === 200){
                makeToast(`sorry but you have not followed the rule so this test is ends here.`);
                setTimeout(()=>{
                    window.location.reload();
                }, 4000);
            }
        }, 1000);
       
        // finally draw the poses
        drawPose(pose);
    }
   
    
    function drawPose(pose) {
        if (webcam.canvas) {
            ctx.drawImage(webcam.canvas, 0, 0);
            // draw the keypoints and skeleton
            if (pose) {
                const minPartConfidence = 0.5;
                tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
                tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
            }
        }
    }
    let instr = document.querySelector("#instruction");
    function beforeStart(){
        instr.className = "show";
    }
    function startTest(){
        init();
        makeToast('wait for few seconds!');
        instr.className = instr.className.replace('show', '');
    }
    function cancelBox(){
        instr.className = instr.className.replace('show', '');
    }
    function makeToast(msg) {
        var x = document.getElementById("snackbar");
        x.innerHTML = msg;
        x.className = "show";
       
        setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
      }