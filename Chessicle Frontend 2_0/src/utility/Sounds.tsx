export const playSound = (sound: string) => {
    const soundToPlay = new Audio(`assets/sounds/${sound}.mp3`);
    soundToPlay.play();
}