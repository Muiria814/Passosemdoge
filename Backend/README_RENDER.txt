Render backend deployment instructions
-------------------------------------

1. Create a new Web Service on Render (https://render.com) -> New -> Web Service.
2. Connect GitHub or choose manual deploy from this folder.
3. Build command: npm install
4. Start command: node server.js
5. Add Environment Variables (if you want to override values in code):
   CARTEIRA = B
   PIN = 1234
   LEVANTAMENTO = B
   UTILIZADOR = unico
   (Note: the backend in this package uses hardcoded defaults. Environment variables can still be set for PORT)
6. Deploy. After deploy, copy the service URL (e.g. https://backend-doge.onrender.com)
7. Update the frontend script.js in the netlify_frontend folder: replace https://YOUR_RENDER_URL with the Render service URL.
