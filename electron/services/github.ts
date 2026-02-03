import { Octokit } from 'octokit';

export const inviteCollaborator = async (
    accessToken: string,
    owner: string,
    repo: string,
    username: string
) => {
    try {
        const octokit = new Octokit({
            auth: accessToken,
        });

        const response = await octokit.request('PUT /repos/{owner}/{repo}/collaborators/{username}', {
            owner,
            repo,
            username,
            permission: 'pull',
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        return {
            success: true,
            data: response.data,
            status: response.status
        };

    } catch (error: any) {
        console.error('Error inviting GitHub collaborator:', error);
        return {
            success: false,
            error: error.message || 'Unknown error',
            status: error.status
        };
    }
};

export const testConnection = async (accessToken: string, owner: string, repo: string) => {
    try {
        const octokit = new Octokit({
            auth: accessToken,
        });

        // Check current user
        const user = await octokit.request('GET /user', {
            headers: { 'X-GitHub-Api-Version': '2022-11-28' }
        });

        // Check repo access
        const repository = await octokit.request('GET /repos/{owner}/{repo}', {
            owner,
            repo,
            headers: { 'X-GitHub-Api-Version': '2022-11-28' }
        });

        return {
            success: true,
            user: user.data.login,
            repo: repository.data.full_name
        };

    } catch (error: any) {
        if (error.status === 404) {
            // Debugging: Try to fetch list of visible repos to see what's going on
            try {
                const octokit = new Octokit({ auth: accessToken });
                const reposRes = await octokit.request('GET /user/repos', {
                    headers: { 'X-GitHub-Api-Version': '2022-11-28' },
                    per_page: 5,
                    sort: 'updated'
                });
                const visibleRepos = reposRes.data.map((r: any) => r.full_name).join(', ');

                return {
                    success: false,
                    error: `Repo not found. Token can verify specific private repos only if 'repo' scope is enabled. Visible repos: [${visibleRepos}...]`
                };
            } catch (innerError) {
                // If listing also fails, fall back to generic
            }

            return {
                success: false,
                error: "Repository not found. START HERE: Since your repo is PRIVATE, you MUST check the 'repo' box when generating the Token. 'public_repo' is not enough."
            };
        }
        if (error.status === 401) {
            return {
                success: false,
                error: "Unauthorized. Please check your GitHub Personal Access Token."
            };
        }
        return {
            success: false,
            error: error.message
        };
    }
};
