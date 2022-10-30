import { h } from 'start-dom-jsx';
import { createRoot, useState } from './fabriact';

const Main = () => {
  const [count, setCount] = useState(2);
  const [firstName, setFirstName] = useState('Boba');
  const [lastName, setLastName] = useState('Fett');
  const fullName = `${firstName} + ${lastName}`;
  const quote = `${fullName} says: "I'll take ${count} banthas."`;

  const handleFirstNameInput = (e: any) => {
    setFirstName(e.currentTarget.value);
  };

  const handleLastNameInput = (e: any) => {
    setLastName(e.currentTarget.value);
  };

  const handleIncrementClick = () => {
    setCount((x: number) => x + 1);
  };

  return (
    <div>
      <div class="mh-6 m-2">{firstName}</div>
      <div class="mh-6 m-2">{lastName}</div>
      <div class="mh-6 m-2">{fullName}</div>
      <div class="mh-6 m-2">{count}</div>
      <div class="mh-6 m-2">{quote}</div>
      <input
        class="block m-2"
        type="text"
        id="firstName"
        value={firstName}
        onInput={handleFirstNameInput}
      />
      <input
        class="block m-2"
        type="text"
        id="lastName"
        value={lastName}
        onInput={handleLastNameInput}
      />
      <button class="block m-2" id="increment" onClick={handleIncrementClick}>
        Increment
      </button>
    </div>
  );
};

const container = document.querySelector<HTMLDivElement>('#app-fabriact')!;
const root = createRoot(container);

root.render(<Main />);
export {};
