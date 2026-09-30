const API_BASE =
    "https://pindownloader-backend.onrender.com";


const urlInput =
    document.getElementById("urlInput");

const pasteButton =
    document.getElementById("pasteButton");

const getMediaButton =
    document.getElementById("getMediaButton");

const status =
    document.getElementById("status");

const resultSection =
    document.getElementById("resultSection");

const mediaType =
    document.getElementById("mediaType");

const qualityContainer =
    document.getElementById("qualityContainer");

const qualitySelect =
    document.getElementById("qualitySelect");

const downloadButton =
    document.getElementById("downloadButton");

const previewContainer =
    document.getElementById("previewContainer");

const imagePreview =
    document.getElementById("imagePreview");

const videoPreview =
    document.getElementById("videoPreview");


let detectedMediaType = null;

let downloadUrl = null;

let previewUrl = null;


/* =========================
   PASTE
========================= */

pasteButton.addEventListener(
    "click",
    async () => {

        try {

            const text =
                await navigator.clipboard.readText();

            if (!text) {

                status.textContent =
                    "Clipboard is empty.";

                return;
            }

            urlInput.value = text;

            status.textContent =
                "Pinterest URL pasted.";

        } catch (error) {

            status.textContent =
                "Unable to access clipboard. Please paste the URL manually.";

        }

    }
);


/* =========================
   GET MEDIA
========================= */

getMediaButton.addEventListener(
    "click",
    async () => {

        const url =
            urlInput.value.trim();


        if (!url) {

            status.textContent =
                "Please enter a Pinterest URL.";

            urlInput.focus();

            return;
        }


        getMediaButton.disabled = true;

        resultSection.classList.add(
            "hidden"
        );

        qualityContainer.classList.add(
            "hidden"
        );

        previewContainer.classList.add(
            "hidden"
        );

        imagePreview.classList.add(
            "hidden"
        );

        videoPreview.classList.add(
            "hidden"
        );


        detectedMediaType = null;

        downloadUrl = null;

        previewUrl = null;


        status.textContent =
            "Processing Pinterest media...";


        try {

            const response =
                await fetch(
                    `${API_BASE}/api/download`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            url: url,
                            quality: "best"
                        })
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.error ||
                    "Unable to process this Pinterest URL."
                );

            }


            detectedMediaType =
                data.type;


            downloadUrl =
                `${API_BASE}${data.download_url}`;


            previewUrl =
                `${API_BASE}${data.preview_url}`;


            resultSection.classList.remove(
                "hidden"
            );


            if (
                data.type === "video"
            ) {

                mediaType.textContent =
                    "Video detected. Choose a quality and download.";

                await showVideoPreview(
                    previewUrl
                );

                await loadQualities(
                    url
                );

            } else {

                mediaType.textContent =
                    "Image detected. Ready to download.";

                showImagePreview(
                    previewUrl
                );

            }


            status.textContent =
                "Media ready.";

        } catch (error) {

            console.error(error);

            status.textContent =
                error.message ||
                "Something went wrong.";

        } finally {

            getMediaButton.disabled =
                false;

        }

    }
);


/* =========================
   IMAGE PREVIEW
========================= */

function showImagePreview(
    url
) {

    previewContainer.classList.remove(
        "hidden"
    );

    imagePreview.src = url;

    imagePreview.classList.remove(
        "hidden"
    );

}


/* =========================
   VIDEO PREVIEW
========================= */

async function showVideoPreview(
    url
) {

    previewContainer.classList.remove(
        "hidden"
    );

    videoPreview.src = url;

    videoPreview.classList.remove(
        "hidden"
    );

}


/* =========================
   VIDEO QUALITIES
========================= */

async function loadQualities(
    url
) {

    qualityContainer.classList.remove(
        "hidden"
    );


    qualitySelect.innerHTML =
        "<option>Loading qualities...</option>";


    try {

        const response =
            await fetch(
                `${API_BASE}/api/qualities`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        url: url
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            data.success === false
        ) {

            throw new Error(
                data.error ||
                "Unable to load qualities."
            );

        }


        const qualities =
            data.qualities || [];


        qualitySelect.innerHTML =
            "";


        if (
            qualities.length === 0
        ) {

            addQualityOption(
                "best",
                "Best available"
            );

            return;
        }


        qualities.forEach(
            (quality) => {

                addQualityOption(
                    quality,
                    `${quality}p`
                );

            }
        );

    } catch (error) {

        console.error(error);

        qualitySelect.innerHTML =
            "";

        addQualityOption(
            "best",
            "Best available"
        );

    }

}


/* =========================
   QUALITY OPTION
========================= */

function addQualityOption(
    value,
    text
) {

    const option =
        document.createElement(
            "option"
        );

    option.value =
        value;

    option.textContent =
        text;

    qualitySelect.appendChild(
        option
    );

}


/* =========================
   DOWNLOAD
========================= */

downloadButton.addEventListener(
    "click",
    async () => {

        const url =
            urlInput.value.trim();


        if (!url) {

            status.textContent =
                "Please enter a Pinterest URL.";

            return;
        }


        downloadButton.disabled =
            true;


        status.textContent =
            "Preparing your download...";


        try {

            if (
                detectedMediaType ===
                "video"
            ) {

                const selectedQuality =
                    qualitySelect.value ||
                    "best";


                const response =
                    await fetch(
                        `${API_BASE}/api/download`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                url: url,
                                quality:
                                    selectedQuality
                            })
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.error ||
                        "Video download failed."
                    );

                }


                triggerDownload(
                    `${API_BASE}${data.download_url}`,
                    data.filename ||
                    "pindrop-video.mp4"
                );


            } else {

                if (!downloadUrl) {

                    throw new Error(
                        "Download link is not available."
                    );

                }


                triggerDownload(
                    downloadUrl,
                    "pindrop-image.jpg"
                );

            }


            status.textContent =
                "Download started successfully.";

        } catch (error) {

            console.error(error);

            status.textContent =
                error.message ||
                "Download failed.";

        } finally {

            downloadButton.disabled =
                false;

        }

    }
);


/* =========================
   TRIGGER DOWNLOAD
========================= */

function triggerDownload(
    url,
    filename
) {

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        filename;

    link.target =
        "_blank";

    link.rel =
        "noopener";

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

}