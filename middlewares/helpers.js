const { v4: uuidv4 } = require('uuid');

const prettyCurrency = amount => {
    const formatter = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2
    });
    const convertedAmount = formatter.format(amount);
    return convertedAmount;
  }

const  makeTitleCase = str => {
    return str
      .toLowerCase()
      .split(" ")
      .map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

const createUsername = name => {
    let randomId = uuidv4().split('-')[1].toLowerCase();
    let username = name.split(' ')[0].toLowerCase();
    console.log([username,randomId].join('-'))
    return [username,randomId].join('-')
}

module.exports = {
    prettyCurrency,
    makeTitleCase,
    createUsername,
}