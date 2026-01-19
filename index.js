const { cognitoDomain, clientId, redirectUri, logoutUri, helloEndpoint} = window.APP_CONFIG;
function redirectToCognitoSignin(){
    const verifier = generateRandomString(64);
    sessionStorage.setItem("pkce_verifier", verifier);
    const challenge = await generateCodeChallenge(verifier); 
    const responseType = "code";
    const scope= "email+openid+phone+profile";
    window.location.href = `${cognitoDomain}/login?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUri}&code_challenge="${challenge}&code_challenge_method=S256`;
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
        console.log(data)
        document.getElementById('aws-data').innerText = data.body;       
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
async function sha256(plain){
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
function generateCodeChallenge(verifier){
    const hashed = await sha256(verifier);
    return base64UrlEncode(hashed);
}
function getTokensFromUrl() {
  const hash = window.location.hash.substring(1); // remove '#'
  const params = new URLSearchParams(hash);

  return {
    accessToken: params.get("access_token"),
    idToken: params.get("id_token"),
    expiresIn: params.get("expires_in")
  };
}
function storeTokens(tokens) {
    sessionStorage.setItem("access_token", tokens.accessToken);
    sessionStorage.setItem("id_token", tokens.idToken);
    sessionStorage.setItem("expires_in", tokens.expiresIn);
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
async function exchangeCodeForToken(code){
    const verifier = sessionStorage.getItem("pkce_verifier");
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        code,
        redirectUri: redirectUri,
        code_verifier: verifier
    });
    const tokenUrl = cognitoDomain +"/oauth2/token"; 
    const response = await fetch(tokenUrl,{
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body
    });
    return response.json();
}
document.addEventListener("DOMContentLoaded", () => {
  // const tokens = getTokensFromUrl();
  const authCode = getCodeFromUrl();
  let token = "";
  if(authCode){
      token = exchangeCodeForToken(authCode);
      console.log(token);
  }
  
  // const userInfo = parseJWTIdToken(tokens.idToken) || parseJWTIdToken(sessionStorage.getItem("id_token"));
  // const username = userInfo?.name || '';
  // if(username)
  //     document.getElementById("welcome").innerText = `Hi, ${username}`;

  if (tokens.accessToken) {
    storeTokens(tokens);
    // clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
    updateAuthUI();
});
