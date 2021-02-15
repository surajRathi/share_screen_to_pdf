// based from https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos

// Helper function:
// Usage <element onfoo="remove(this)" />
// THIS IS USED, DO NOT DELETE
function remove(el) {
  let element = el; // This was there in the stack overflow answer
  element.remove();
}

// Main code
(function () { // Basically a separate namespace
  let $ = function (id) {
    return document.getElementById(id);
  };

  // TODO: Gracefully handle resizing of screen which is shared
  let width = 640; // Width to scale each screenshot too
  let height = 0; // Calculated from aspect ratio of screenshot

  let streaming = false;  // are we currently streaming?


  // Define 'global' variables
  // Most can only be initialized after the html is loaded

  let stream_stuff = null; // Div containing screen sharing controls

  let video = null; // Video of shared screen
  let auto_clicker = null; // Used with setInterval to automatically take pictures
  let auto_click_interval = 500; // ms between auto screenshot
  // TODO: Expose status of auto clicker and auto_click_interval in HTML

  let canvas = null; // The canvas element for capturing the image, it is hidden.
  let prev_data = null; // ImageData Object,  previous image

  let output_div = null; // div which contains the taken screenshots
  let title = null; // Title element which can be edited by the user.


  // @args: ImageData:
  //            - width
  //            - height
  //            - data : (r,g,b,a)_{x,y} = data[y * width + x: y * width + x + 4]

  // Checks for similarity between images
  function is_new_slide(img, prev_img) {
    if(img === null) return false;
    if(prev_img === null) return true;
    if (img.width !== prev_img.width || img.height !== prev_img.height) return false;
    // TODO: Implement

    // Squared Error
    let threshold = 30;
    let err = 0;
    //               R  G  B  A
    const offsets = [0, 1, 2];
    for (let i = 0; i < 4 * img.height * img.width; i += 4) {
      offsets.forEach((offset) => err += (img.data[i + offset] - prev_img.data[i + offset]) ** 2);
    }
    err /= 3 * img.height * img.width;

    return (err > threshold);

    // return true;
  }

  /*
   Capture a photo by fetching the current contents of the video
   and drawing it into a canvas, then converting that to a PNG
   format data URL. By drawing it on an offscreen canvas and then
   drawing that to the screen, we can change its size and/or apply
   other changes before drawing it. TODO: What does the last line mean?
  */

  function take_screenshot() {
    let context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      let cur_data = context.getImageData(0, 0, canvas.width, canvas.height);

      if (is_new_slide(cur_data, prev_data)) {
        // TODO: Use Blob?
        let data = canvas.toDataURL('image/png');
        let img = document.createElement('img');
        img.setAttribute('src', data);
        img.setAttribute('onauxclick', 'remove(this)');
        output_div.appendChild(img);
        output_div.appendChild(document.createElement('br'));
        prev_data = cur_data;
      }
    }
  }

  // Called when html is completely loaded.
  function initialize() {
    // Get DOM elements
    stream_stuff = $('screen_share_controls');
    $('start_button').onclick = start_stream;

    video = $('video');
    $('click_button').onclick = take_screenshot;
    $('auto_click').onclick = function () {
      if (auto_clicker === null) {
        auto_clicker = setInterval(take_screenshot, auto_click_interval);
        $("auto_click_status").innerText = "ON";
        $("auto_click_interval").innerText = auto_click_interval;
      } else {
        clearInterval(auto_clicker);
        auto_clicker = null;
        $("auto_click_status").innerText = "OFF";
        $("auto_click_interval").innerText = auto_click_interval;
      }
    }

    $('stop_button').onclick = function () {
      let tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
      stream_stuff.remove();
    }

    canvas = $('canvas');

    output_div = $('output');

    // Allow the document title to be edited
    title = $('title')
    title.onblur = function () {
      document.title = title.innerHTML;
    }

  }


  // Starts the screen sharing
  // Must be called from the onclick of a button
  // Because cannot screen share otherwise
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

  }


  // Call initialize on html load
  window.addEventListener('load', initialize, false);
})();
