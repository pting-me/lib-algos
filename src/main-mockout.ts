import { applyBindings, computed, observable } from './mockout';

const count = observable(2);
const firstName = observable('Boba');
const lastName = observable('Fett');
const fullName = computed(() => `${firstName()} ${lastName()}`);
const quote = computed(
  () => `${fullName()} says: "I'll take ${count()} banthas."`
);

document.querySelector<HTMLDivElement>('#app-mockout')!.innerHTML = `
  <div class="mh-6 m-2" data-bind="text: firstName"></div>
  <div class="mh-6 m-2" data-bind="text: lastName"></div>
  <div class="mh-6 m-2" data-bind="text: fullName"></div>
  <div class="mh-6 m-2" data-bind="text: count"></div>
  <div class="mh-6 m-2" data-bind="text: quote"></div>
  <input class="block m-2" type="text" id="firstName" value="${firstName()}" />
  <input class="block m-2" type="text" id="lastName" value="${lastName()}" />
  <button class="block m-2" id="increment">Increment</button>
`;

const viewModel = {
  firstName,
  lastName,
  fullName,
  count,
  quote,
};

applyBindings(viewModel);

document
  .querySelector<HTMLInputElement>('#firstName')!
  .addEventListener('input', (e: Event) => {
    const value = (e.target as HTMLInputElement)?.value ?? '';
    firstName(value);
  });
document
  .querySelector<HTMLInputElement>('#lastName')!
  .addEventListener('input', (e: Event) => {
    const value = (e.target as HTMLInputElement)?.value ?? '';
    lastName(value);
  });
document
  .querySelector<HTMLButtonElement>('#increment')!
  .addEventListener('click', () => count(count() + 1));

export {};
