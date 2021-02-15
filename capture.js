// based from https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos

// Helper function:

// Usage <element onfoo="remove(this)" />
function remove(el) {
  let element = el;
  element.remove();
}

// Main code
(function () { // Basically a separate namespace

  let width = 640;// Width to scale each screenshot too
  let height = 0; // Calculated from aspect ratio of screenshot

  let streaming = false;  // are we currently streaming?


  // Define 'global' variables
  // Most can only be initialized after the html is loaded

  let stream_stuff = null; // Div containing screen sharing controls

  let video = null; // Video of shared screen
  let auto_clicker = null; // Used with setInterval to automatically take pictures

  let canvas = null; // The canvas element for capturing the image, it is hidden.
  let prev_img = null; // Base64 encoded previous image

  let output_div = null; // div which contains the taken screenshots
  let title = null; // Title element which can be edited by the user.

  // Called when html is completely loaded.
  function initialize() {
    // Get DOM elements
    stream_stuff = document.getElementById('streaming_elements');
    document.getElementById('start_button').onclick = start_stream;
    document.getElementById('stop_button').onclick = function () {
      video.pause();
      video.removeAttribute('src');
      video.load();
      stream_stuff.remove();
    }

    video = document.getElementById('video');
    document.getElementById('click_button').onclick = takepicture;
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

    // click_button.addEventListener('click', function (ev) {
    //   takepicture();
    //   ev.preventDefault();
    // }, false);

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

      // TODO: Check for duplicates

      let img = document.createElement('img');
      img.setAttribute('src', data);
      img.setAttribute('onauxclick', 'remove(this)');
      output_div.appendChild(img);
      output_div.appendChild(document.createElement('br'));
      prev_img = data;

    } else {
      clearphoto();
    }
  }

  // Set up our event listener to run the startup process
  // once loading is complete.

  window.addEventListener('load', initialize, false);
})();
