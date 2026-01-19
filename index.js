const { cognitoDomain, clientId, redirectUri, logoutUri, helloEndpoint}
function redirectToCognitoSignin(){
    //const cognitoDomain = "https://us-east-1fbrmebrpm.auth.us-east-1.amazoncognito.com";
    //const clientId = "4njv430igdgtiktp1ihoj2mbsp";
    const responseType = "token";
    const scope= "email+openid+phone";
    //const redirectUri = "https%3A%2F%2Fmaster.d14qlcgzstnyh7.amplifyapp.com%2F";
    window.location.href = `${cognitoDomain}/login?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUri}`;
}
function signOutRedirect () {
    //const cognitoDomain = "https://us-east-1fbrmebrpm.auth.us-east-1.amazoncognito.com";
    //const clientId = "4njv430igdgtiktp1ihoj2mbsp";
    //const logoutUri = "https://master.d14qlcgzstnyh7.amplifyapp.com/logout-callback.html";
    window.location.href = `${cognitoDomain}/logout/?client_id=${clientId}&logout_uri=${logoutUri}`;
};

function callAwsData(){
    fetch(helloEndpoint, {      //"https://kpyupsvpue.execute-api.us-east-1.amazonaws.com/dev/hello", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${getAccessToken()}`,
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
}
function getAccessToken() {
  return sessionStorage.getItem("access_token");
}
document.addEventListener("DOMContentLoaded", () => {
  const tokens = getTokensFromUrl();

  if (tokens.accessToken) {
    storeTokens(tokens);
    // clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("signIn")
    .addEventListener("click", redirectToCognitoSignin);
});

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("signOut")
    .addEventListener("click", signOutRedirect);
});
