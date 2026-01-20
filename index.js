const { cognitoDomain, clientId, redirectUri, logoutUri, helloEndpoint} = window.APP_CONFIG;
function redirectToCognitoSignin(){
    const responseType = "token";
    const scope= "email+openid+phone+profile";
    window.location.href = `${cognitoDomain}/login?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUri}`;
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
document.addEventListener("DOMContentLoaded", () => {
  const tokens = getTokensFromUrl();
  if (tokens.accessToken) {
    storeTokens(tokens);
    // clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
    updateAuthUI();
});
