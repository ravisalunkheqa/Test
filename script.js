// Get all the HTML elements we will work with
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const photo = document.getElementById('photo');
const startCameraButton = document.getElementById('start-camera');
const takePhotoButton = document.getElementById('take-photo');
const getLocationButton = document.getElementById('get-location');
const locationStatus = document.getElementById('location-status');
const locationDataDiv = document.getElementById('location-data');
const latitudeSpan = document.getElementById('latitude');
const longitudeSpan = document.getElementById('longitude');
const accuracySpan = document.getElementById('accuracy');
const mapLink = document.getElementById('map-link');
const dataSummary = document.getElementById('data-summary');
const downloadButton = document.getElementById('download-btn');

// Variables to store our data
let cameraStream = null;
let currentLocation = null;
let currentPhotoDataUrl = null;

// --- CAMERA FUNCTIONS ---
// Start the camera when the button is clicked[citation:6]
startCameraButton.addEventListener('click', async function() {
    try {
        // Request access to the user's camera (prefer front-facing)
        const constraints = {
            video: {
                facingMode: 'user', // 'user' is usually the front camera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Show the video stream in the <video> element
        video.srcObject = cameraStream;
        startCameraButton.disabled = true;
        startCameraButton.innerHTML = '<i class="fas fa-check"></i> Camera Active';
        takePhotoButton.disabled = false;
        
    } catch (err) {
        console.error('Error accessing the camera:', err);
        alert('Could not access the camera. Please make sure you have granted permission.');
    }
});

// Take a picture when the button is clicked[citation:6]
takePhotoButton.addEventListener('click', function() {
    if (!cameraStream) {
        alert('Please start the camera first.');
        return;
    }
    
    // Set canvas size to match video
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas image to a data URL (a text representation of the image)
    currentPhotoDataUrl = canvas.toDataURL('image/png');
    
    // Display the captured image
    photo.src = currentPhotoDataUrl;
    
    // Update the data summary
    updateDataSummary();
    alert('Photo captured successfully!');
});

// --- GPS FUNCTIONS ---
// Get the GPS location when the button is clicked[citation:1][citation:5]
getLocationButton.addEventListener('click', function() {
    locationStatus.textContent = 'Getting location...';
    locationStatus.style.color = '#f39c12';
    
    if (!navigator.geolocation) {
        locationStatus.textContent = 'Geolocation is not supported by your browser.';
        locationStatus.style.color = '#e74c3c';
        return;
    }
    
    // Request high-accuracy location
    const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
        // Success callback
        function(position) {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: Math.round(position.coords.accuracy)
            };
            
            // Update the display with location data
            latitudeSpan.textContent = currentLocation.latitude.toFixed(6);
            longitudeSpan.textContent = currentLocation.longitude.toFixed(6);
            accuracySpan.textContent = currentLocation.accuracy;
            
            // Create a link to open the location in Google Maps
            mapLink.href = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
            mapLink.textContent = `View on Google Maps`;
            
            // Show the location data and update status
            locationDataDiv.classList.remove('hidden');
            locationStatus.textContent = 'Location acquired successfully!';
            locationStatus.style.color = '#27ae60';
            getLocationButton.innerHTML = '<i class="fas fa-check"></i> Location Acquired';
            getLocationButton.disabled = true;
            
            // Update the data summary
            updateDataSummary();
        },
        // Error callback
        function(error) {
            let message = 'Unknown error';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Permission denied. Please allow location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    message = 'The request to get location timed out.';
                    break;
            }
            locationStatus.textContent = `Error: ${message}`;
            locationStatus.style.color = '#e74c3c';
        },
        options
    );
});

// --- DATA HANDLING FUNCTIONS ---
// Update the summary section with captured photo and location
function updateDataSummary() {
    let summaryHTML = '';
    
    if (currentPhotoDataUrl) {
        summaryHTML += `<p><strong><i class="fas fa-camera"></i> Photo Captured:</strong> Yes</p>`;
        summaryHTML += `<img src="${currentPhotoDataUrl}" alt="Captured Photo" style="max-width:200px; border-radius:8px; margin-top:10px;">`;
    } else {
        summaryHTML += `<p><strong><i class="fas fa-camera"></i> Photo Captured:</strong> Not yet</p>`;
    }
    
    if (currentLocation) {
        summaryHTML += `<p style="margin-top:15px;"><strong><i class="fas fa-map-pin"></i> Location Captured:</strong> Yes</p>`;
        summaryHTML += `<p>Coordinates: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}</p>`;
        summaryHTML += `<p>Accuracy: Within ${currentLocation.accuracy} meters</p>`;
    } else {
        summaryHTML += `<p style="margin-top:15px;"><strong><i class="fas fa-map-pin"></i> Location Captured:</strong> Not yet</p>`;
    }
    
    // Show download button only if we have at least one type of data
    if (currentPhotoDataUrl || currentLocation) {
        downloadButton.classList.remove('hidden');
    }
    
    dataSummary.innerHTML = summaryHTML;
}

// Download captured data as a text file
downloadButton.addEventListener('click', function() {
    let data = '=== GPS & Camera Data Capture ===\n\n';
    data += `Date: ${new Date().toLocaleString()}\n\n`;
    
    if (currentLocation) {
        data += '--- LOCATION DATA ---\n';
        data += `Latitude: ${currentLocation.latitude}\n`;
        data += `Longitude: ${currentLocation.longitude}\n`;
        data += `Accuracy: ${currentLocation.accuracy} meters\n`;
        data += `Google Maps Link: https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}\n\n`;
    }
    
    if (currentPhotoDataUrl) {
        data += '--- PHOTO DATA ---\n';
        data += `A photo was captured. The image data is stored in the browser.\n`;
        data += `To save the actual image, right-click on the photo above and select "Save Image As".`;
    }
    
    if (!currentLocation && !currentPhotoDataUrl) {
        data += 'No data has been captured yet.';
    }
    
    // Create a downloadable file
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captured_data_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});
