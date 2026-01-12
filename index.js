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
