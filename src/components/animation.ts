import anime, { type AnimeInstance, type AnimeParams } from 'animejs';

export type RafAnimateCallback = (stop: () => void) => void;

export function animate(params: AnimeParams) {
  return new Promise<void>(resolve => {
    anime({
      ...params,
      complete(args: AnimeInstance) {
        params?.complete?.(args);
        resolve();
      },
    });
  });
}

/**
 * Peforms an animation of undefined duration using `requestAnimationFrame()`.
 * @param callback
 */
export function rafAnimate(callback: RafAnimateCallback) {}
