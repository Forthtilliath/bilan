import { TestBed } from '@angular/core/testing';

import { ColumnChart } from './column-chart';
import { arcPath, DonutChart } from './donut-chart';
import { LineChart } from './line-chart';
import { Sparkline } from './sparkline';

const DATES = ['2026-01-04', '2026-01-11', '2026-01-18', '2026-01-25'];

async function lineChart() {
  const fixture = TestBed.createComponent(LineChart);
  fixture.componentRef.setInput('dates', DATES);
  fixture.componentRef.setInput('series', [
    { key: 'a', label: 'Patrimoine', color: 'red', values: [100, 120, 110, 140], area: true },
    { key: 'b', label: 'Placements', color: 'blue', values: [10, 20, 30, 40] },
  ]);
  fixture.componentRef.setInput('label', 'Évolution');
  await fixture.whenStable();
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

describe('LineChart', () => {
  it('draws one line per series, an area wash only where asked, and round y ticks', async () => {
    const { host } = await lineChart();

    expect(host.querySelectorAll('.chart__line')).toHaveLength(2);
    expect(host.querySelectorAll('.chart__area')).toHaveLength(1);
    const ticks = [...host.querySelectorAll('.chart__grid text')].map((t) => t.textContent.trim());
    expect(ticks.length).toBeGreaterThanOrEqual(3);
    expect(host.querySelector('svg')?.getAttribute('aria-label')).toBe('Évolution');
  });

  it('shows every series at the focused date and moves with the arrow keys', async () => {
    const { fixture, host } = await lineChart();
    const hit = host.querySelector('.chart__hit');

    hit?.dispatchEvent(new FocusEvent('focus'));
    await fixture.whenStable();
    expect(host.querySelector('.chart-tooltip')?.textContent).toContain('25 janv. 2026');
    expect(host.querySelectorAll('.chart-tooltip__row')).toHaveLength(2);

    hit?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await fixture.whenStable();
    expect(host.querySelector('.chart-tooltip')?.textContent).toContain('18 janv. 2026');

    hit?.dispatchEvent(new FocusEvent('blur'));
    await fixture.whenStable();
    expect(host.querySelector('.chart-tooltip')).toBeNull();
  });
});

describe('ColumnChart', () => {
  it('draws a bar per series and category, and reports the clicked category', async () => {
    const fixture = TestBed.createComponent(ColumnChart);
    fixture.componentRef.setInput('categories', ['2026-08', '2026-09']);
    fixture.componentRef.setInput('labels', ['août', 'sept.']);
    fixture.componentRef.setInput('series', [
      { key: 'in', label: 'Revenus', color: 'green', values: [3000, 3500] },
      { key: 'out', label: 'Dépenses', color: 'orange', values: [2000, 1800] },
    ]);
    fixture.componentRef.setInput('selected', '2026-09');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const picked = vi.fn();
    fixture.componentInstance.picked.subscribe(picked);

    expect(host.querySelectorAll('.chart__bar')).toHaveLength(4);
    expect(host.querySelectorAll('.chart__band--selected')).toHaveLength(1);
    host
      .querySelectorAll<SVGRectElement>('.chart__hit--column')[0]
      ?.dispatchEvent(new MouseEvent('click'));
    expect(picked).toHaveBeenCalledWith('2026-08');
  });
});

describe('DonutChart', () => {
  it('skips empty slices and spotlights the hovered one', async () => {
    const fixture = TestBed.createComponent(DonutChart);
    fixture.componentRef.setInput('slices', [
      { key: 'a', label: 'Logement', value: 900, color: 'blue' },
      { key: 'b', label: 'Courses', value: 300, color: 'orange' },
      { key: 'c', label: 'Vide', value: 0, color: 'grey' },
    ]);
    fixture.componentRef.setInput('centerValue', '1 200 €');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    const arcs = host.querySelectorAll('.donut__arc');
    expect(arcs).toHaveLength(2);
    arcs[1]?.dispatchEvent(new Event('pointerenter'));
    await fixture.whenStable();
    expect(host.querySelector('.donut__center')?.textContent).toContain('Courses');
    expect(host.querySelector('.donut__share')?.textContent).toContain('25,0');
    expect(host.querySelectorAll('.donut__arc--dim')).toHaveLength(1);
  });

  it('closes a full ring without a degenerate arc', () => {
    const path = arcPath(50, 50, 30, 50, 0, Math.PI * 2);
    expect(path).toMatch(/^M.*A50,50 0 1 1 .*L.*A30,30 0 1 0 .*Z$/);
  });
});

describe('Sparkline', () => {
  it('needs at least two points', async () => {
    const fixture = TestBed.createComponent(Sparkline);
    fixture.componentRef.setInput('values', [5]);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('svg')).toBeNull();

    fixture.componentRef.setInput('values', [5, 8, 6]);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('.sparkline__line')).not.toBeNull();
  });
});
