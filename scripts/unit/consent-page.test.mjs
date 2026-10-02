import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import * as React from 'react';
import * as jsx from 'react/jsx-runtime';
import * as icons from 'lucide-react';
import { loadModule } from './test-support.mjs';

function setup() {
  const state = [];
  let cursor = 0;
  const LegalModal = () => null;
  const onConsentAgreed = mock.fn();
  const { ConsentPage } = loadModule('src/pages/ConsentPage.tsx', {
    dependencies: {
      react: { ...React, useEffect() {}, useState: (initial) => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], (value) => { state[index] = value; }];
      } },
      'react/jsx-runtime': jsx, 'lucide-react': icons, '../components/LegalModal': { LegalModal },
    },
  });
  const render = () => { cursor = 0; return ConsentPage({ onConsentAgreed }); };
  function find(predicate, element = render()) {
    if (!React.isValidElement(element)) return undefined;
    if (predicate(element)) return element.props;
    return React.Children.toArray(element.props.children).map((child) => find(predicate, child)).find(Boolean);
  }
  const control = (id) => find((element) => element.props.id === id);
  const toggle = (id, checked) => control(id).onChange({ target: { checked } });
  return { control, toggle, onConsentAgreed, modal: () => find((element) => element.type === LegalModal) };
}

test('legal acceptance alone cannot bypass affirmative adult age confirmation', () => {
  const h = setup();
  assert.equal(h.control('adult-age-confirmation-checkbox').checked, false);
  h.toggle('consent-acknowledgment-checkbox', true);
  const action = h.control('agree-continue-button');
  assert.equal(action.disabled, true);
  assert.equal(action['aria-disabled'], true);
  action.onClick();
  assert.equal(h.onConsentAgreed.mock.callCount(), 0);
});

test('age confirmation alone cannot bypass legal acceptance', () => {
  const h = setup();
  h.toggle('adult-age-confirmation-checkbox', true);
  assert.equal(h.control('agree-continue-button').disabled, true);
  h.control('agree-continue-button').onClick();
  assert.equal(h.onConsentAgreed.mock.callCount(), 0);
});

test('adult confirmation and master acceptance allow continuation; withdrawing age blocks it again', () => {
  const h = setup();
  h.toggle('adult-age-confirmation-checkbox', true);
  h.toggle('consent-acknowledgment-checkbox', true);
  assert.equal(h.control('agree-continue-button').disabled, false);
  h.control('agree-continue-button').onClick();
  assert.deepEqual(h.onConsentAgreed.mock.calls[0].arguments, [{ terms: true, privacy: true, disclaimer: true, guidelines: true, declaration: true }, 'master_declaration']);
  h.toggle('adult-age-confirmation-checkbox', false);
  assert.equal(h.control('agree-continue-button').disabled, true);
  h.control('agree-continue-button').onClick();
  assert.equal(h.onConsentAgreed.mock.callCount(), 1);
});

test('accepting all four individual forms still requires adult confirmation', () => {
  const h = setup();
  for (const id of ['terms', 'privacy', 'disclaimer', 'guidelines']) h.modal().onAccept(id);
  assert.equal(h.control('agree-continue-button').disabled, true);
  h.toggle('adult-age-confirmation-checkbox', true);
  assert.equal(h.control('agree-continue-button').disabled, false);
  h.control('agree-continue-button').onClick();
  assert.equal(h.onConsentAgreed.mock.callCount(), 1);
});
