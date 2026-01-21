const { cognitoDomain, clientId, redirectUri, logoutUri, helloEndpoint} = window.APP_CONFIG;
async function redirectToCognitoSignin(){
    const verifier = generateRandomString(64);
    sessionStorage.setItem("pkce_verifier", verifier);
    const challenge = await generateCodeChallenge(verifier); 
    const responseType = "code";
    const scope= "email+openid+phone+profile";
    window.location.href = `${cognitoDomain}/login?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUri}&code_challenge=${challenge}&code_challenge_method=S256`;
}
function signOutRedirect () {
    window.location.href = `${cognitoDomain}/logout/?client_id=${clientId}&logout_uri=${logoutUri}`;
};

function callAwsData(){
    const aToken = getAccessToken();
    fetch(helloEndpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${aToken}`,
        "Content-Type": "application/json"
      }
    })
    .then(res => {
      if (res.status === 401) {
        redirectToCognitoSignin();
      }
      return res.json();
    })
    .then(data => {
          const table = document.getElementById("recipeTableWrapper");
          const tbody = document.getElementById("recipeTable");
          tbody.innerHTML = "";
          console.log(data);
          if (data?.body?.records?.length > 0) {
              data.body.records.forEach(r => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${r.Name}</td>`;
                tbody.appendChild(tr);
              });
              table.classList.remove("hidden"); // show
          } else {
              table.classList.add("hidden"); // keep hidden if no data
          }
    })
    .catch(err => console.error('Error fetching data from AWS:', err) );
}
function generateRandomString(length){
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for(let i=0; i<length; i++){
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
async function convertSH256(plain){
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest("SHA-256",data);
}
function base64UrlEncode(buffer){
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}
async function generateCodeChallenge(verifier){
    const hashed = await convertSH256(verifier);
    return base64UrlEncode(hashed);
}
// following method is used when using implicit grant because tokens are directly sent with the URL
// function getTokensFromUrl() {
//   const hash = window.location.hash.substring(1); // remove '#'
//   const params = new URLSearchParams(hash);

//   return {
//     accessToken: params.get("access_token"),
//     idToken: params.get("id_token"),
//     expiresIn: params.get("expires_in")
//   };
// }
function storeTokens(tokens) {
    sessionStorage.setItem("access_token", tokens.access_token);
    sessionStorage.setItem("id_token", tokens.id_token);
    sessionStorage.setItem("expires_in", tokens.expires_in);
}
function getAccessToken() {
    return sessionStorage.getItem("access_token");
}
function getIdToken() {
    return sessionStorage.getItem("id_token");
}
function getExpiresIn(){
    return sessionStorage.getItem("expires_in");
}
function parseJWTIdToken(token){
    if(!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/,'/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload);
}
function isLoggedIn(){
     const token = getIdToken();
     if(!token) return false;
     try{
         const userInfo = parseJWTIdToken(sessionStorage.getItem("id_token"));
         return Date.now() < userInfo.exp * 1000;
     } catch{
         return false;
     }
}
function updateAuthUI(){
    const authBtn = document.getElementById("authorize");
    const welcome = document.getElementById("welcome");
    if(isLoggedIn()){
        const userInfo = parseJWTIdToken(sessionStorage.getItem("id_token"));
        const username = userInfo.name;
        authBtn.innerText = "Sign Out";
        authBtn.onclick = signOutRedirect;

        welcome.innerText  = `Hi, ${username}`;
    }else{
        authBtn.innerText = "Sign In";
        authBtn.onclick = redirectToCognitoSignin;

        welcome.innerText  = "";
    }
}
function getCodeFromUrl(){
    const params = new URLSearchParams(window.location.search);
    return params.get("code");
}
async function exchangeCodeForToken(authCode){
    const verifier = sessionStorage.getItem("pkce_verifier");
    const tokenUrl = cognitoDomain +"/oauth2/token"; 
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", clientId);
    params.append("code", authCode);
    params.append("redirect_uri", redirectUri);
    params.append("code_verifier", verifier);
    
    const response = await fetch(tokenUrl,{
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
    });
    const data = await response.json();
    return data;
}
async function handleAuthRedirect(){
    const authCode = getCodeFromUrl();
    let tokens = "";
    if(authCode){
      tokens = await exchangeCodeForToken(authCode);
    }
    if (tokens.access_token) {
        storeTokens(tokens);
        // clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    updateAuthUI();
}
document.addEventListener("DOMContentLoaded", () => {
  handleAuthRedirect();
});
