'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function usePageLoadAnimation() {
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('#header', { opacity: 1, y: 0, duration: 0.8 })
      .to('.metric-card', { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, '-=0.4')
      .to('#charts-section', { opacity: 1, y: 0, duration: 0.8 }, '-=0.3')
      .to('#alerts-section', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
      .to('#footer', { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');
  }, []);
}

export function useMetricAnimation(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    gsap.fromTo(
      element,
      { scale: 1.2, opacity: 0.6 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
    );

    const parent = element.parentElement;
    if (parent) {
      gsap.to(parent, {
        boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
        duration: 0.3,
        yoyo: true,
        repeat: 1,
      });
    }
  }, [elementRef]);
}

export function useHoverAnimation(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    const handleMouseEnter = () => {
      gsap.to(element, {
        y: -10,
        boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        y: 0,
        boxShadow: '0 0 0 rgba(139, 92, 246, 0)',
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [elementRef]);
}

export function useAlertAnimation(elementRef: React.RefObject<HTMLElement>, severity: string) {
  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    gsap.fromTo(
      element,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' }
    );

    if (severity === 'critical' || severity === 'high') {
      gsap.to(element, {
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
        duration: 0.5,
        yoyo: true,
        repeat: 3,
      });
    }
  }, [elementRef, severity]);
}
