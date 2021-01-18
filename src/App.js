import React, {useEffect, useRef,useState} from 'react';
import './App.css';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as kmmClassifier from '@tensorflow-models/knn-classifier';
import * as tf from '@tensorflow/tfjs';
import {Howl} from 'howler';
import soundURL from './assets/hey_sondn.mp3';
import { initNotifications, notify} from '@mycv/f8-notification';

var sound = new Howl({
  src: [soundURL]
});
const NOT_TOUCH_LABEL= 'not_Touch';
const TOUCHED_LABEL = 'touched';
const TRAINING_TIMES = 50;
const TOUCHED_CONFIDENCE = 0.8;
function App() {
  const video = useRef();
  const classifier = useRef();
  const canPlaySond = useRef(true);
  const mobilenetModule = useRef(); 
  const [touch, setTouched] = useState(false);
  const init = async() =>{
    console.log('init...');
    await setupCamera();
    console.log('setup camera success');
    classifier.current = kmmClassifier.create();
    mobilenetModule.current = await mobilenet.load();
    console.log('setup done');
    console.log('no touch face button train 1');
    initNotifications({colldown: 3000 });
  }

  const setupCamera = () => {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia || 
      navigator.webkitGetUserMedia || 
      navigator.mozGetUserMedia || 
      navigator.msGetUserMedia;

      if(navigator.getUserMedia) {
        navigator.getUserMedia(
          {video: true},
          stream => {
            video.current.srcObject = stream;
            video.current.addEventListener('loadeddata',resolve)
          },
          error => reject(error)
        );
           } else {
        reject();
      } 
    });
  }
  const train = async label => {
    console.log(`[${label}] Dang train`);
    for (let i=0; i<TRAINING_TIMES; ++i) {
     console.log(`progress ${parseInt(i+1) / TRAINING_TIMES * 100}%`);
    await training(label);
    }
  }

  const training = label => {
    return new Promise(async  resolve => {
      const embedding = mobilenetModule.current.infer(
     video.current,
     true
      );
      classifier.current.addExample(embedding, label);
      await sleep(100);
      resolve();
    });
  }
  const run = async() => {
    const embedding = mobilenetModule.current.infer(
      video.current,
      true
    );
    const result = await classifier.current.predictClass(embedding);
   if (
     result.label === TOUCHED_LABEL &&
     result.confidences[result.label] > TOUCHED_CONFIDENCE
   ) {
     console.log('Touched');
     canPlaySond.current = false;
     sound.play();
     notify('Bo tay ra!', { body:'Ban vau cham tay vao mat'})
     setTouched(true);
   }else
   {
     console.log('not touched');
     setTouched(false);
   }
    await sleep(200);
    run();
  }
  const sleep = (ms = 0) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  useEffect(() => {
    
      init();
      sound.on('end', function(){
        canPlaySond.current = true;
      })
      return () => {
    }

  },[]);
  return (
    <div className={`main ${touch ? 'touched' : ' '}`}>
   <h1>HELLO REACTJS</h1>
   <video
   ref={video}
   className="video"
   autoPlay
   />
   <div className="control">
<button className="btn" onClick={()=> train(NOT_TOUCH_LABEL)}>Train 1</button>
<button className="btn" onClick={()=> train(TOUCHED_LABEL)}>Train 2</button>
<button className="btn" onClick={()=> run()}>Run</button>
   </div>

    </div>  
  );
}

export default App;
