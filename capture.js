// based from https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos


(function () {
  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  let width = 640;    // We will scale the photo width to this
  let height = 0;     // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  let streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  let stream_stuff = null; // Div containting streaming stuff
  let video = null; // Video element
  let click_button = null; // Takes a photo
  let auto_clicker = null;
  let canvas = null; // The 'hidden' canvas element
  let prev_img = null;

  let output_div = null;
  let title = null;

  // Initialize the HTML element,
  function initialize() {
    // Initialize document elements
    stream_stuff = document.getElementById('streaming_elements');
    document.getElementById('start_button').onclick = start_stream;
    document.getElementById('stop_button').onclick = function () {
      stream_stuff.remove();
    }

    video = document.getElementById('video');
    click_button = document.getElementById('click_button');
    document.getElementById('auto_click').onclick = function () {
      if (auto_clicker === null)
        auto_clicker = setInterval(takepicture, 1000);
      else {
        clearInterval(auto_clicker);
        auto_clicker = null;
      }
    }
    canvas = document.getElementById('canvas');

    output_div = document.getElementById('output');
    title = document.getElementById('title')
    title.onblur = function () {
      document.title = title.innerHTML;
    }

  }

  function start_stream() {
    navigator.mediaDevices.getDisplayMedia()
      .then(function (stream) {
        video.srcObject = stream;
        video.play();
        console.log("Got screen sharing stream " + stream.id)
      })
      .catch(function (err) {
        console.log("An error occurred: " + err);
      });

    video.addEventListener('canplay', function (ev) {
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth / width);

        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.

        if (isNaN(height)) {
          height = width / (4 / 3);
        }

        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

    click_button.addEventListener('click', function (ev) {
      takepicture();
      ev.preventDefault();
    }, false);

    clearphoto();
  }

  // Fill the photo with an indication that none has been
  // captured.

  function clearphoto() {
    let context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Capture a photo by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.

  function takepicture() {
    let context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      let data = canvas.toDataURL('image/png');

      let img = document.createElement('img');
      img.setAttribute('src', data);
      output_div.appendChild(img);
      output_div.appendChild(document.createElement('br'));

    } else {
      clearphoto();
    }
  }

  // Set up our event listener to run the startup process
  // once loading is complete.

  window.addEventListener('load', initialize, false);
})();
