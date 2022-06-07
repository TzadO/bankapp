'use strict';

const account1 = {
  owner: 'Arjan den Os',
  movements: [200, 455.23, -306.5, 2500, -642.21, -133.9, 79.97, 1300],
  pin: 1111,
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
  movements: [1000, 3400, -150, -790, -3210, -1000, 3500, -30],
  pin: 2222,
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

const options = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};

const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelTimer = document.querySelector('.timer');
const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');
const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');
const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

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
createUsernames(accounts);
console.log(`Accounts ${account1.username}:${account1.pin} (EU) or ${account2.username}:${account2.pin} (US)`);

function displayMovements(acc, sort = false) {
  containerMovements.innerHTML = '';
  let depositNr = 1;
  let withdrawalNr = 1;
  const movePlusDate = [];
  acc.movements.forEach(function (mov, i) {
    movePlusDate[i] = [acc.movements[i], acc.movementsDates[i]];
  });
  const movs = sort ? movePlusDate.sort((a, b) => a[0] - b[0]) : movePlusDate;
  movs.forEach(function (mov) {
    const displayDate = formatMovementDate(new Date(mov[1]));
    const displayValue = formatCurrency(mov[0], acc.locale, acc.currency);
    const type = mov[0] > 0 ? 'deposit' : 'withdrawal';
    const html = `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">
          ${type === 'deposit' ? depositNr : withdrawalNr} ${type}
        </div>
        <div class="movements__date">${displayDate}
        </div>
        <div class="movements__value">${displayValue}
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
  const balanceLocale = formatCurrency(acc.balance, acc.locale, acc.currency);
  labelBalance.textContent = balanceLocale;
}

function displaySummary(acc) {
  const incomes = acc.movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  const expenses = acc.movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);
  const incomesLocale = formatCurrency(incomes, acc.locale, acc.currency);
  const expenseLocale = formatCurrency(expenses, acc.locale, acc.currency);
  labelSumOut.textContent = expenseLocale;
  labelSumIn.textContent = incomesLocale;
}

function updateUI(account) {
  displayMovements(account);
  displayBalance(account);
  displaySummary(account);
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

function startLogOutTimer() {
  let time = 10 * 60;
  const tick = function () {
    const min = `${Math.trunc(time / 60)}`.padStart(2, 0);
    const sec = `${time % 60}`.padStart(2, 0);
    labelTimer.textContent = `${min}:${sec}`;
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

btnLogin.addEventListener('click', function (e) {
  e.preventDefault();
  currentAccount = accounts.find(
    acc => acc.username === inputLoginUsername.value
  );
  if (currentAccount?.pin === Number(inputLoginPin.value)) {
    labelWelcome.textContent = `Welcome back ${
      currentAccount.owner.split(' ')[0]
    }`;
    containerApp.style.opacity = '1';
    labelDate.textContent = new Intl.DateTimeFormat(
      currentAccount.locale,
      options
    ).format(new Date());
    updateUI(currentAccount);
    inputLoginUsername.value = inputLoginPin.value = '';
    if (timer) clearInterval(timer);
    timer = startLogOutTimer();
  }
});

btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();
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
  } else alert('cannot transfer that value');
  clearInterval(timer);
  timer = startLogOutTimer();
});

btnLoan.addEventListener('click', function (e) {
  e.preventDefault();
  const amount = Math.floor(inputLoanAmount.value);
  if (
    amount > 0 &&
    currentAccount.movements.some(move => move >= amount * 0.1)
  ) {
    setTimeout(function () {
      currentAccount.movements.push(amount);
      currentAccount.movementsDates.push(new Date().toISOString());
      updateUI(currentAccount);
    }, 3000);
  } else {alert('Loan cannot be bigger then 10% of highest deposit')}
  inputLoanAmount.value = '';
  clearInterval(timer);
  timer = startLogOutTimer();
});

btnClose.addEventListener('click', function (e) {
  e.preventDefault();
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
    containerApp.style.opacity = '0';
    labelWelcome.textContent = `Goodbye ${currentAccount.owner.split(' ')[0]}`;
  }
  inputCloseUsername.value = inputClosePin.value = '';
});

btnSort.addEventListener('click', function (e) {
  e.preventDefault();
  displayMovements(currentAccount, !sorted);
  sorted = !sorted;
});