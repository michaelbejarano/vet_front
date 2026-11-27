export function formatScheduleTime(time: string): string {
    return time.slice(0, 5);
}

export function toApiTime(time: string): string {
    return time.length === 5 ? `${time}:00` : time;
}

export function timeToSeconds(time: string): number {
    const [hours, minutes, seconds = 0] =
        time.split(':').map(Number);

    return hours * 3600 + minutes * 60 + seconds;
}

export function hasTimeOverlap(
    startAt: string,
    endAt: string,
    existingStartAt: string,
    existingEndAt: string
): boolean {
    return (
        timeToSeconds(startAt) < timeToSeconds(existingEndAt) &&
        timeToSeconds(endAt) > timeToSeconds(existingStartAt)
    );
}