import { useMemo, useState } from "react";

interface PackageData {
    name: string;
    current: {
        version: string;
        publishDate: string;
    };
    next?: {
        version: string;
        publishDate: string;
    };
}

function calculateDaysBehind(nextDate: string): number {
    const next = new Date(nextDate);
    const now = new Date();
    const diffTime = Math.abs(next.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getUrgency(days: number): "low" | "medium" | "high" {
    if (days <= 30) return "low";
    if (days <= 90) return "medium";
    return "high";
}

function getUrgencyLabel(urgency: string): string {
    switch (urgency) {
        case "low":
            return "Up to date";
        case "medium":
            return "Consider updating";
        case "high":
            return "Update recommended";
        default:
            return "Unknown";
    }
}

function loadPackagesData(): PackageData[] {
    try {
        const dataScript = document.getElementById("packages-data");
        if (dataScript) {
            return JSON.parse(dataScript.textContent || "[]");
        } else {
            console.error("No embedded package data found");
            return [];
        }
    } catch (error) {
        console.error("Failed to load package data:", error);
        return [];
    }
}

const packagesData = loadPackagesData().map((item) => {
    const daysBehind = item.next
        ? calculateDaysBehind(item.next?.publishDate)
        : 0;

    return {
        name: item.name,
        daysBehind,
        urgency: getUrgency(daysBehind),
        current: item.current,
        next: item.next,
    };
});

export default function App() {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "age" | "urgency">("age");

    const filteredAndSortedPackages = useMemo(() => {
        const filtered = packagesData.filter((pkg) =>
            pkg.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );

        filtered.sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "age": {
                    const aDays = a.daysBehind;
                    const bDays = b.daysBehind;
                    return bDays - aDays;
                }
                case "urgency": {
                    const urgencyOrder = { high: 3, medium: 2, low: 1 };
                    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
                }
                default:
                    return 0;
            }
        });

        return filtered;
    }, [searchTerm, sortBy]);

    const summary = useMemo(() => {
        const totalPackages = packagesData.length;
        const outdatedPackages = packagesData.filter(
            (pkg) => pkg.daysBehind > 0,
        ).length;
        const highUrgency = packagesData.filter(
            (pkg) => pkg.urgency === "high",
        ).length;

        return {
            totalPackages,
            outdatedPackages,
            highUrgency,
            upToDatePercentage: Math.round(
                ((totalPackages - outdatedPackages) / totalPackages) * 100,
            ),
        };
    }, []);

    return (
        <div className="container">
            <header>
                <h1>📦 Package Analysis Report</h1>
                <div className="summary">
                    <div className="summary-item">
                        <div className="summary-value">
                            {summary.totalPackages}
                        </div>
                        <div className="summary-label">Total Packages</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-value">
                            {summary.outdatedPackages}
                        </div>
                        <div className="summary-label">Outdated</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-value">
                            {summary.highUrgency}
                        </div>
                        <div className="summary-label">High Priority</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-value">
                            {summary.upToDatePercentage}%
                        </div>
                        <div className="summary-label">Up to Date</div>
                    </div>
                </div>
            </header>

            <div className="controls">
                <input
                    type="text"
                    placeholder="Search packages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    value={sortBy}
                    onChange={(e) =>
                        setSortBy(e.target.value as "name" | "age" | "urgency")
                    }
                >
                    <option value="name">Sort by Name</option>
                    <option value="age">Sort by Age</option>
                    <option value="urgency">Sort by Update Urgency</option>
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Package</th>
                            <th>Current Version</th>
                            <th>Latest Version</th>
                            <th>Days Behind</th>
                            <th>Urgency</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedPackages.map((pkg) => {
                            const daysBehind = pkg.daysBehind;
                            const urgency = pkg.urgency;

                            return (
                                <tr key={pkg.name}>
                                    <td className="package-name">{pkg.name}</td>
                                    <td>
                                        <span className="version">
                                            {pkg.current.version}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="version">
                                            {pkg.next?.version || "Latest"}
                                        </span>
                                    </td>
                                    <td className="days-behind">
                                        {daysBehind}
                                    </td>
                                    <td>
                                        <span
                                            className={`urgency urgency-${urgency}`}
                                        >
                                            {getUrgencyLabel(urgency)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
