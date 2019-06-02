function onScoreBoard(scores) {
    let scoreString = '';
    scores.forEach((score) => {
        scoreString += '<tr><td>' + score.username + '</td><td>' + score.score + '</td></tr>';
    });

    document.getElementById('scoreboard').innerHTML = scoreString;
}