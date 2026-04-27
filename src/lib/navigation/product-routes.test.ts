import test from 'node:test';
import assert from 'node:assert/strict';
import { getFooterRoutes, getHeaderRoutes, productRoutes } from './product-routes.ts';

test('getHeaderRoutes returns exactly isInHeader routes', () => {
  const expected = productRoutes.filter((route) => route.isInHeader).map((route) => route.href);
  const actual = getHeaderRoutes().map((route) => route.href);
  assert.deepEqual(actual, expected);
});

test('getFooterRoutes returns exactly isInFooter routes', () => {
  const expected = productRoutes.filter((route) => route.isInFooter).map((route) => route.href);
  const actual = getFooterRoutes().map((route) => route.href);
  assert.deepEqual(actual, expected);
});

test('all route href values start with slash', () => {
  for (const route of productRoutes) {
    assert.equal(route.href.startsWith('/'), true);
  }
});

test('all header labels are non-empty', () => {
  for (const route of productRoutes) {
    assert.ok(route.headerLabel.trim().length > 0);
  }
});

test('all primary CTA values are non-empty', () => {
  for (const route of productRoutes) {
    assert.ok(route.primaryCta.trim().length > 0);
  }
});

test('no duplicate href values exist', () => {
  const hrefs = productRoutes.map((route) => route.href);
  const unique = new Set(hrefs);
  assert.equal(unique.size, hrefs.length);
});

test('header route count stays lean', () => {
  assert.ok(getHeaderRoutes().length <= 6);
});
