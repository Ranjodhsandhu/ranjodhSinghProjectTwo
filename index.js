// import { UserManager } from 'https://cdn.jsdelivr.net/npm/oidc-client-ts@2.4.1/dist/oidc-client-ts.esm.js';
// import {UserManager} from 'https://cdnjs.cloudflare.com/ajax/libs/oidc-client-ts/3.3.0/browser/oidc-client-ts.min.js';
import {UserManager} from 'https://cdnjs.cloudflare.com/ajax/libs/oidc-client-ts/3.3.0/esm/oidc-client-ts.js';
// import {UserManager} from 'https://cdnjs.cloudflare.com/ajax/libs/oidc-client-ts/3.3.0/umd/oidc-client-ts.min.js';
// import {UserManager} from 'https://cdnjs.cloudflare.com/ajax/libs/oidc-client-ts/3.3.0/umd/oidc-client-ts.js';

const cognitoAuthConfig = {
    authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_HXpPDeMec",
    client_id: "3u7q4ibc22oueihj4b7q141quv",
    redirect_uri: "https://master.d14qlcgzstnyh7.amplifyapp.com/",
    response_type: "code",
    scope: "phone openid email"
};

// create a UserManager instance
export const userManager = new UserManager({
    ...cognitoAuthConfig,
});

export async function signOutRedirect () {
    const clientId = "3u7q4ibc22oueihj4b7q141quv";
    const logoutUri = "/logout-callback.html";
    const cognitoDomain = "https://us-east-1hxppdemec.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
};

export function callAwsData(){
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
