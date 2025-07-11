# README.md
# json-schema-builder
Build JSON Schema

## How to Run Locally

Because this project uses modern JavaScript modules (`import`/`export`), you cannot run it by simply opening `index.html` in your browser from the local filesystem (`file:///...`). This is due to browser security policies (CORS).

You need to serve the files using a local web server. Here's a simple way to do it using Python.

1.  **Navigate to the project directory:**
    Open your terminal or command prompt and change to the directory where `index.html` is located.

    ```bash
    cd path/to/json-schema-builder
    ```

2.  **Start a local server:**
    If you have Python 3 installed, run:
    ```bash
    python3 -m http.server
    ```
    If you have Python 2, run:
    ```bash
    python -m SimpleHTTPServer
    ```

3.  **Open the application:**
    Open your web browser and go to the URL provided by the server, which is typically:
    [http://localhost:8000](http://localhost:8000)

### Alternative (Node.js)

If you have Node.js installed, you can use the `http-server` package:

