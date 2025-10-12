export interface PackageInfo {
    name: string;
    current: {
        version: string;
        publishDate: Date;
    };
    next?: {
        version: string;
        publishDate: Date;
    };
}

interface NpmRegistryResponse {
    versions: Record<string, unknown>;
    time: Record<string, string>;
}

const isPrereleaseRegex = /^\d+\.\d+\.\d+-/;

const isPrerelease = (version: string) => isPrereleaseRegex.test(version);

export async function fetchPackageInfo(
    packageName: string,
    currentVersion: string,
): Promise<PackageInfo> {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch package info for ${packageName}`);
    }

    const data = (await response.json()) as NpmRegistryResponse;
    const versions = Object.keys(data.versions)
        .filter((version) => !isPrerelease(version))
        .sort((a, b) => {
            const packageATime = data.time[a];
            const packageBTime = data.time[b];

            if (packageATime === undefined || packageBTime === undefined) {
                throw new Error("No time found for package");
            }

            return (
                new Date(packageATime).getTime() -
                new Date(packageBTime).getTime()
            );
        });

    let currentVersionIndex = versions.indexOf(currentVersion);
    let currentVersionPublishDate = data.time[currentVersion];

    if (isPrerelease(currentVersion)) {
        const baseVersion = currentVersion.split("-")[0];
        if (!baseVersion) {
            throw new Error(`Invalid version format: ${currentVersion}`);
        }

        currentVersionIndex = versions.indexOf(baseVersion);

        if (currentVersionIndex === -1) {
            // If base version not found, use the latest available version
            currentVersionIndex = versions.length - 1;
        }

        const resolvedVersion = versions[currentVersionIndex];
        if (!resolvedVersion) {
            throw new Error(
                `No stable versions found for package ${packageName}`,
            );
        }

        currentVersionPublishDate = data.time[resolvedVersion];
    }

    if (currentVersionPublishDate == null) {
        throw new Error(
            `No time data found for resolved version ${currentVersion}`,
        );
    }

    const nextVersion = versions[currentVersionIndex + 1];

    const current = {
        version: currentVersion,
        publishDate: new Date(currentVersionPublishDate),
    };

    if (nextVersion === undefined) {
        return {
            name: packageName,
            current,
        };
    }

    const nextPublishDate = data.time[nextVersion];
    if (nextPublishDate == null) {
        throw new Error("Next version not found in time data");
    }

    const next = {
        version: nextVersion,
        publishDate: new Date(nextPublishDate),
    };

    return {
        name: packageName,
        current,
        next,
    };
}
