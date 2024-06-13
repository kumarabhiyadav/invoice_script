const api = {
  domain: "http://localhost:4001",
  endPoints: {
    status: "/status",
    download: "/download",
    upload: "/upload",
    process: "/process",
  },
};

const getHistoryData = document.getElementById("historylist");



document.getElementById("file-input").addEventListener("change", function () {
  const fileInput = this;
  const file = fileInput.files[0]; // Get the selected file
 

const companyName = document.getElementById("companyName");
const companyAddress = document.getElementById("companyAddress");
const companyEmail = document.getElementById("companyEmail");

const stateSelect = document.getElementById('states');
const selectedState = stateSelect.options[stateSelect.selectedIndex].value;

  console.log(companyAddress.value);
  console.log(companyName.value);
  console.log(selectedState);



  if (file) {
    const formData = new FormData(); // Create a new FormData object
    formData.append("file", file); // Append the file to the FormData object
    formData.append('companyName',companyName.value)
    formData.append('companyAddress',companyAddress.value)
    formData.append('selectedState',selectedState);
    formData.append('companyEmail',companyEmail.value);



    // Make a POST request to the server to upload the file
    fetch(`${api.domain}${api.endPoints.upload}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Upload failed");
        }
        return response.text(); // If the upload is successful, you may receive a response from the server
      })
      .then((data) => {
        console.log("Upload successful:", data);

        let fileName = JSON.parse(data).filename;
        fetch(`${api.domain}${api.endPoints.process}/${fileName}`);
        fetchData();
        fileInput.value = "";
        // Optionally, do something with the response from the server
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });
  } else {
    console.error("No file selected");
  }
});

function downloadFile(fileName) {
  //   console.log(fileName);

  fetch(`${api.domain}${api.endPoints.download}/${fileName}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.blob();
    })
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch((error) => {
      console.error("Error downloading file:", error);
    });
}

function fetchData() {
  fetch(`${api.domain}${api.endPoints.status}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      // Process the fetched data
      console.log("Fetched data:", data);

      hist = "";

      data.forEach((element) => {
        hist += `<ul onclick="handleClick('${element.file}', '${element.result}')">${element.file}  
        ${new Date(element.createdAt).toLocaleString()}
        ${
          
          element.status == "processing"
            ? `<img height="20" width="20" src="loading.gif">`
            : element.result == "success" && element.status == "done"
            ? `<img width="15" height="15" src="https://img.icons8.com/fluency/48/download.png" alt="download"/>`
            : element.result == "failed" && element.status == "done"
            ? `<img width="15" height="15" src="https://img.icons8.com/pulsar-gradient/48/fail.png" alt="fail"/>`
            : ""
        }  </ul>`;
      });

      getHistoryData.innerHTML = hist;
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

function handleClick(fileName, result) {
  if (result === "failed") {
      alert(`File '${fileName}' failed to download.`);
  } else {
      downloadFile(fileName);
  }
}

window.addEventListener("load", fetchData);
