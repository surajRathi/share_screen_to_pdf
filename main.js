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

  let discard_similar_slides = true;

  let canvas = null; // The canvas element for capturing the image, it is hidden.
  let prev_data = null; // ImageData Object,  previous image
  let prev_url = null;
  let prev_background_color = Uint8ClampedArray.from([255, 255, 255, 255]); // TODO: Shouldn't need to set like this.

  let output_div = null; // div which contains the taken screenshots
  let title = null; // Title element which can be edited by the user.


  // @args: ImageData:
  //            - width
  //            - height
  //            - data : (r,g,b,a)_{x,y} = data[y * width + x: y * width + x + 4]

  /*
* 1. Take an initial screenshot
* 2. Get a background color "median"ish on a random sample | Assume white background
* 3. On next ss, check which pixels have changed, if only background pixels have changed, update the photo
* 4. Otherwise this is a new slide go to 1
 */

  // Checks for similarity between images
  function is_new_slide(img, prev_img, background_color) {
    if (img === null) return false;
    if (prev_img === null) return true;
    if (img.width !== prev_img.width || img.height !== prev_img.height) return false;

    function has_been_annotated(img, prev_img, background_color, change_frac = 0.3, overwrite_frac = 0.05, color_dist_thresh = 100) {
      function color_distance(pixel1, pixel2, offset_1 = 0, offset_2 = 0) {
        let dist = 0;
        for (let i = 0; i < 4; i++)
          dist += (pixel1[offset_1 + i] - pixel2[offset_2 + i]) ** 2;
        return dist;
      }

      let changed = 0;
      let annotated = 0;
      const n_pixels = img.width * img.height;
      for (let i = 0; i < n_pixels * 4; i += 4) {
        if (color_distance(img.data, prev_img.data, i, i) > color_dist_thresh) {
          changed++;
          if (color_distance(prev_img.data, background_color, i, 0) > color_dist_thresh)
            annotated++;
        }
      }
      const overwritten = changed - annotated;

      console.log(n_pixels, changed, change_frac * n_pixels, overwritten, overwrite_frac * n_pixels);
      $('bar_1').style.height = Math.ceil(1000 * changed / n_pixels).toString() + "%";
      $('bar_1').innerText = Math.ceil(1000 * changed / n_pixels).toString() + "%";
      $('bar_2').style.height = Math.ceil(1000 * overwritten / n_pixels).toString() + "%";
      $('bar_2').innerText = Math.ceil(1000 * overwritten / n_pixels).toString() + "%";
      $('bar_2').style.height = Math.ceil(1000 * overwritten / n_pixels).toString() + "%";
      $('bar_2').innerText = Math.ceil(1000 * overwritten / n_pixels).toString() + "%";
      $('bar_3').style.height = Math.ceil(100 * overwritten / changed).toString() + "%";
      $('bar_3').innerText = Math.ceil(100 * overwritten / changed).toString() + "%";
      // changed < 0.5 percent -> annotated
      //
      // num changed pixels and number of overwritten pixels should be below a threshold
      return changed <= 0.005 * n_pixels || annotated >= 0.4 * changed;
    }

    return !has_been_annotated(img, prev_img, background_color)
  }

  /*
   Capture a photo by fetching the current contents of the video
   and drawing it into a canvas, then converting that to a PNG
   format data URL. By drawing it on an offscreen canvas and then
   drawing that to the screen, we can change its size and/or apply
   other changes before drawing it. TODO: What does the last line mean?
  */

  function get_background_color(img_data) {
    // TODO: Implement
    // return Uint8ClampedArray.from([255, 255, 255, 255]);
    return [255, 255, 255, 255];
  }

  function take_screenshot(keep_all_slides = false) {
    let context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      let cur_data = context.getImageData(0, 0, canvas.width, canvas.height);

      if (prev_url !== null && (keep_all_slides || is_new_slide(cur_data, prev_data, prev_background_color))) {
        // TODO: Use Blob?
        let img = document.createElement('img');
        img.className = "screenshot";
        img.setAttribute('src', prev_url);
        img.setAttribute('onauxclick', 'remove(this)');
        output_div.appendChild(img);
        // output_div.appendChild(document.createElement('br'));

        prev_background_color = get_background_color(cur_data);
      }
      prev_url = canvas.toDataURL('image/png');
      prev_data = cur_data;
    }
  }

  // Called when html is completely loaded.
  function initialize() {
    // Get DOM elements
    stream_stuff = $('screen_share_controls');
    $('start_button').onclick = start_stream;

    video = $('video');
    $('click_button').onclick = () => take_screenshot(true);
    $('auto_click').onclick = function () {
      if (auto_clicker === null) {
        auto_clicker = setInterval(() => take_screenshot(!discard_similar_slides), auto_click_interval);
        $("auto_click_status").innerText = "ON";
        $("auto_click_interval").innerText = auto_click_interval;
      } else {
        clearInterval(auto_clicker);
        auto_clicker = null;
        $("auto_click_status").innerText = "OFF";
        $("auto_click_interval").innerText = auto_click_interval;
      }
    }

    // TODO: Rename and add indicator
    $('discard_similar_slides').onclick = function () {
      discard_similar_slides = !discard_similar_slides;
    }

    $('stop_button').onclick = function () {
      let tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
      take_screenshot(false)
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
    width = $('screen_share_controls').clientWidth * 0.9

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
        video.controls = false
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

  }


  // Call initialize on html load
  window.addEventListener('load', initialize, false);
})();
