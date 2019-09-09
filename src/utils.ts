export const normalizeHex = (input: string) => {
    if (input.startsWith('0x')) {
        return input
    }
    if (input.length % 2 === 1) {
        return '0x0' + input
    } else {
        return '0x' + input
    }
}
