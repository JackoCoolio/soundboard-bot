export function log(message: any): void {
    const date = new Date()
    console.log(`[${date.toISOString()}] ${message}`)
}
