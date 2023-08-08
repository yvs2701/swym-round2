const API_URL = 'http://localhost:3000/process_csv/';
const form = document.getElementById("form");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const files = document.getElementById("files");

  if (files.files.length === 0) {
    return alert("Please select a file to upload");
  }
  if (files.files.length > 1) {
    return alert("Please select only one file to upload");
  }
  else {
    const formData = new FormData();

    formData.append("file", files.files[0]);

    fetch(API_URL, {
      method: 'POST',
      body: formData,
    })
      .then((res) => console.log(res))
      .catch((err) => ("Error occured", err));
  }
});