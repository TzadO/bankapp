'use strict';

const account1 = {
  owner: 'Arjan den Os',
  pin: 1111,
  movements: [200, 455.23, -306.5, 2500, -642.21, -133.9, 79.97, 1300],
  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2022-03-15T17:01:17.194Z',
    '2022-03-16T22:36:17.929Z',
    '2022-03-17T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'nl-NL',
};

const account2 = {
  owner: 'John Doe',
  pin: 2222,
  movements: [1000, 3400, -150, -790, -3210, -1000, 3500, -30],
  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2022-03-17T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2];
let currentAccount, timer;
let sorted = false;


function createUsernames(accs) {
  accs.forEach( acc => (
    acc.username = acc.owner
        .toLowerCase()
        .split(' ')
        .map(namepart => namepart[0])
        .join('')));
}


function formatMovementDate(date) {
  const calcDaysPassed = (date1, date2) =>
    Math.trunc((date1 - date2) / (1000 * 60 * 60 * 24));
  const daysPassed = calcDaysPassed(new Date(), date);
  let result;
  if (daysPassed === 0) result = 'Today';
  else if (daysPassed === 1) result = 'Yesterday';
  else if (daysPassed <= 7) result = `${daysPassed} days ago`;
  else result = new Intl.DateTimeFormat(currentAccount.locale).format(date);
  return result;
}


function formatCurrency(value, locale, currency) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
}


function displayMovements(acc, sort = false) {
  const containerMovements = document.querySelector('.movements');
  containerMovements.innerHTML = '';
  
  const movePlusDate = [];
  acc.movements.forEach(function (mov, i) {
    movePlusDate[i] = [acc.movements[i], acc.movementsDates[i]];
  });
  
  const movs = sort ? movePlusDate.sort((a, b) => a[0] - b[0]) : movePlusDate;
  let depositNr = 1;
  let withdrawalNr = 1;

  movs.forEach(function (mov) {
    const type = mov[0] > 0 ? 'deposit' : 'withdrawal';
    const html = `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">
          ${type === 'deposit' ? depositNr : withdrawalNr} ${type}
        </div>
        <div class="movements__date">${formatMovementDate(new Date(mov[1]))}
        </div>
        <div class="movements__value">${formatCurrency(mov[0], acc.locale, acc.currency)}
        </div>
      </div>
    `;
    containerMovements.insertAdjacentHTML('afterbegin', html);
    type === 'deposit' ? depositNr++ : withdrawalNr++;
  });
}


function displayBalance(acc) {
  acc.balance = acc.movements.reduce(
    (accumulator, mov) => accumulator + mov,
    0
  );
  document.querySelector('.balance__value').textContent = formatCurrency(acc.balance, acc.locale, acc.currency);
}


function displaySummary(acc) {
  const incomes = acc.movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  const expenses = acc.movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);
  document.querySelector('.summary__value--out').textContent = formatCurrency(expenses, acc.locale, acc.currency);
  document.querySelector('.summary__value--in').textContent = formatCurrency(incomes, acc.locale, acc.currency);
}


function updateUI(account) {
  displayMovements(account);
  displayBalance(account);
  displaySummary(account);
}


function startLogOutTimer() {
  let time = 10 * 60;
  
  const tick = function () {
    const min = `${Math.trunc(time / 60)}`.padStart(2, 0);
    const sec = `${time % 60}`.padStart(2, 0);
    document.querySelector('.timer').textContent = `${min}:${sec}`;
  
    if (time === 0) {
      clearInterval(timer);
      location.reload();
    }
    time--;
  };

  tick();
  const timer = setInterval(tick, 1000);
  return timer;
}


function login(event) {
  event.preventDefault();

  const inputLoginUsername = document.querySelector('.login__input--user');
  const inputLoginPin = document.querySelector('.login__input--pin');
  
  currentAccount = accounts.find(
    acc => acc.username === inputLoginUsername.value
  );
  if (currentAccount?.pin === Number(inputLoginPin.value)) {
    document.querySelector('.welcome').textContent = `Welcome back ${
      currentAccount.owner.split(' ')[0]
    }`;
    document.querySelector('.app').style.opacity = '1';
    
    document.querySelector('.date').textContent = new Intl.DateTimeFormat(
      currentAccount.locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    .format(new Date());

    updateUI(currentAccount);
    inputLoginUsername.value = inputLoginPin.value = '';

    if (timer) clearInterval(timer);
    timer = startLogOutTimer();
  }
};


function transfer(event) {
  event.preventDefault();

  const inputTransferTo = document.querySelector('.form__input--to');
  const inputTransferAmount = document.querySelector('.form__input--amount');
  const amount = Number(inputTransferAmount.value);
  const receiverAcc = accounts.find(
    acc => acc.username === inputTransferTo.value
  );
  
  if (!receiverAcc) {
    alert('no valid acount found')
    inputTransferTo.value = '';
    return
  }

  if (receiverAcc.username === currentAccount.username) {
    alert('cannot transfer to self')
    inputTransferTo.value = '';
    return
  }

  if (amount > 0 && amount < currentAccount.balance) {
    const now = new Date().toISOString();
    currentAccount.movementsDates.push(now);
    receiverAcc.movementsDates.push(now);
    currentAccount.movements.push(-amount);
    receiverAcc.movements.push(amount);
    inputTransferAmount.value = inputTransferTo.value = '';
    updateUI(currentAccount);
  } 
  
  else alert('cannot transfer that value');

  clearInterval(timer);
  timer = startLogOutTimer();
};


function loan(event) {
  event.preventDefault();

  const inputLoanAmount = document.querySelector('.form__input--loan-amount');
  const amount = Math.floor(inputLoanAmount.value);

  if (amount > 0 && currentAccount.movements.some(move => move >= amount * 0.1)) {
    setTimeout(function () {
      currentAccount.movements.push(amount);
      currentAccount.movementsDates.push(new Date().toISOString());
      updateUI(currentAccount);
    }, 3000);
  } 
  else {alert('Loan cannot be bigger then 10% of highest deposit')}

  inputLoanAmount.value = '';
  clearInterval(timer);
  timer = startLogOutTimer();
};


function closeAccount(event) {
  event.preventDefault();

  const inputCloseUsername = document.querySelector('.form__input--user');
  const inputClosePin = document.querySelector('.form__input--pin');

  if (
    inputCloseUsername.value === currentAccount.username &&
    Number(inputClosePin.value) === currentAccount.pin
  ) {
    accounts.splice(
      accounts.findIndex(
        account => account.username === currentAccount.username
      ),
      1
    );
    document.querySelector('.app').style.opacity = '0';
    document.querySelector('.welcome').textContent = `Goodbye ${currentAccount.owner.split(' ')[0]}`;
  }

  inputCloseUsername.value = inputClosePin.value = '';
};


function addEventHandlers() {
  document.querySelector('.btn--sort').addEventListener('click', function (e) {
    e.preventDefault();
    displayMovements(currentAccount, !sorted);
    sorted = !sorted;
  });
  document.querySelector('.login__btn').addEventListener('click', event => login(event))
  document.querySelector('.form__btn--transfer').addEventListener('click', event => transfer(event));
  document.querySelector('.form__btn--loan').addEventListener('click', event => loan(event));
  document.querySelector('.form__btn--close').addEventListener('click', event => closeAccount(event));
}


createUsernames(accounts);
addEventHandlers();

console.log(`Accounts: ${accounts[0].username}-${accounts[0].pin}(${accounts[0].locale}), ${accounts[1].username}-${accounts[1].pin}(${accounts[1].locale})`);