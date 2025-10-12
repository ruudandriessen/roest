import { Octokit } from "octokit";
import { KNOWN_LOCK_FILES } from "../util/autodetectLockFile";

interface LockFile {
    path: string;
    content: string;
}

async function getCommitSha({
    octokit,
    owner,
    repo,
    ref,
}: {
    octokit: Octokit;
    owner: string;
    repo: string;
    ref?: string;
}): Promise<string> {
    if (ref) {
        const { data: refData } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${ref}`,
        });
        return refData.object.sha;
    }

    const { data: repoInfo } = await octokit.rest.repos.get({
        owner,
        repo,
    });

    const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${repoInfo.default_branch}`,
    });
    return refData.object.sha;
}

export async function findLockFilesFromRepo({
    repo,
    owner,
    token,
    ref,
}: {
    repo: string;
    owner: string;
    token: string;
    ref?: string;
}): Promise<LockFile[]> {
    const octokit = new Octokit({
        auth: token,
    });

    try {
        const commitSha = await getCommitSha({ octokit, owner, repo, ref });

        const { data: tree } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: commitSha,
            recursive: "true",
        });

        const lockFilePaths = tree.tree.filter((item) => {
            if (item.type !== "blob") return false;

            const fileName = item.path?.split("/").pop() || "";
            return KNOWN_LOCK_FILES.includes(fileName);
        });

        const lockFiles = await Promise.all(
            lockFilePaths.map(async (item): Promise<LockFile | null> => {
                try {
                    if (!item.path || !item.sha) return null;

                    const { data: blob } = await octokit.rest.git.getBlob({
                        owner,
                        repo,
                        file_sha: item.sha,
                    });

                    const content = Buffer.from(
                        blob.content,
                        blob.encoding as BufferEncoding,
                    ).toString("utf-8");

                    return {
                        path: item.path,
                        content,
                    };
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        console.warn(
                            `Failed to fetch ${item.path}:`,
                            error.message,
                        );
                    }
                    return null;
                }
            }),
        );

        return lockFiles.filter((item): item is LockFile => item !== null);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(
                `Failed to fetch lock files from tree:`,
                error.message,
            );
        }
        return [];
    }
}
