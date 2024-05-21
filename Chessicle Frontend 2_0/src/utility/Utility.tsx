export const sinInversePercentage = (percent: number) => {
    return 0.5 * Math.sin(Math.PI * percent - Math.PI / 2) + 0.5;
}