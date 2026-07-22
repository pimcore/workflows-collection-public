import processHelper from 'child_process';


function prepareGitPath(repository) {

    if(process.env.PERSONAL_ACCESS_TOKEN) {
        return 'https://oauth2:' + process.env.PERSONAL_ACCESS_TOKEN + '@github.com/' + repository + '.git';
    } else {
        return 'git@github.com:' + repository + '.git';
    }

}


export function cloneRepository(directory, repository) {
    console.log('Call git clone ... ');
    let output = processHelper.execSync('git clone ' + prepareGitPath(repository), {'cwd': directory});
    console.log(output.toString());
}

export function fetchRepository(directory) {
    console.log('Call git fetch ... ');
    let output = processHelper.execSync('git fetch', {'cwd': directory});
    console.log(output.toString());
}

export function createBranch(directory, branchName) {
    try {
        console.log('Creating branch ' + branchName + ' ...');
        processHelper.execSync('git checkout -b ' + branchName, {'cwd': directory});
        return { action: 'created' };
    } catch (e) {
        console.log('Branch already exists, switching to it...');
        processHelper.execSync('git checkout ' + branchName, {'cwd': directory});
        return { action: 'checked out existing' };
    }
}

export function checkoutBranch(directory, branch) {

    console.log('Call git fetch ... ');
    let output = processHelper.execSync('git fetch', {'cwd': directory});
    console.log(output.toString());

    console.log('Call git checkout ... ');
    output = processHelper.execSync('git checkout ' + branch, {'cwd': directory});
    console.log(output.toString());

    console.log('Call git reset ... ');
    output = processHelper.execSync('git reset --hard', {'cwd': directory});
    console.log(output.toString());

    console.log('Call git clean ... ');
    output = processHelper.execSync('git clean -fd', {'cwd': directory});
    console.log(output.toString());

    try {
        console.log('Call git pull ... ');
        output = processHelper.execSync('git pull', {'cwd': directory});
        console.log(output.toString());
    } catch (e) {
        console.log('Pull not possible: ' + e);
    }

}







