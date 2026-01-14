function redirectToCognitoSignin(){
    const cognitoDomain = "https://us-east-1hxppdemec.auth.us-east-1.amazoncognito.com";
    const clientId = "3u7q4ibc22oueihj4b7q141quv";
    const responseType = "token";
    const scope= "email+openid+phone";
    const redirectUri = "https%3A%2F%2Fcognit-oauth.d14qlcgzstnyh7.amplifyapp.com%2F";
    window.location.href = `${cognitoDomain}/login?client_id=${clientId}&respsone_type=${responseType}&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}
function signOutRedirect () {
    const clientId = "3u7q4ibc22oueihj4b7q141quv";
    const logoutUri = "/logout-callback.html";
    const cognitoDomain = "https://us-east-1hxppdemec.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
};

function callAwsData(){
    fetch('https://kpyupsvpue.execute-api.us-east-1.amazonaws.com/dev/hello')
    .then(response => response.json())
    .then(data => {
        console.log(data);
        document.getElementById('aws-data').innerText = data.body;
    })
    .catch(error => {
        console.error('Error fetching data from AWS:', error);
    });
}
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
