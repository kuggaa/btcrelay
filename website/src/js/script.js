var mainNetHost = 'http://frontier-lb.ether.camp';
var testNetHost = 'https://morden.infura.io:8545';
var mainNetAddr = '0x41f274c0023f83391de4e0733c609df5a124c3d4';
var testNetAddr = '0x5770345100a27b15f5b40bec86a701f888e8c601';
var heightPerRelay;
var relayAddr;
var lastNet = 'main';

$(function() {
  function updatePage(net) {
    lastNet = net;
    $('#warnSync').hide();
    $('#header').html((net === 'main' ? 'Main' : 'Test') + ' net live status' + (net === 'test' ? ' <small>(may need relayers)</small>' : ''));
    relayAddr = net === 'main' ? mainNetAddr : testNetAddr;
    $('#relayAddr').text(relayAddr);

    setTimeout(function() {getStatus(net);}, 400);
  }

  function getStatus(net) {
    web3 = new Web3(new Web3.providers.HttpProvider(net === 'main' ? mainNetHost : testNetHost));

    relayAddr = net === 'main' ? mainNetAddr : testNetAddr;

    updateBCI();
    updateBlockr();

    var RelayContract = web3.eth.contract(btcRelayAbi);
    var contract = RelayContract.at(relayAddr);

    heightPerRelay = contract.getLastBlockHeight.call().toString();
    $('#latestBlockHeight').text(heightPerRelay);

    var headHash = contract.getBlockchainHead.call();
    $('#latestBlockHash').text(formatHash(headHash));

    var feeVTX = web3.fromWei(contract.getFeeAmount.call(headHash), 'ether');
    $('#feeVTX').text(feeVTX);

    var feeRecipient = contract.getFeeRecipient.call(headHash).toString(16);
    $('#feeRecipient').text('0x' + formatETHAddress(feeRecipient));

    window.btcrelayTester = contract;

    setTimeout(checkHeights, 1000);
  }

  function updateBCI() {
    $.getJSON('https://blockchain.info/q/getblockcount?cors=true', function(data) {
      $('#bciBlockHeight').text(data);
    });
  }

  function updateBlockr() {
    $.getJSON('http://btc.blockr.io/api/v1/block/info/last', function(data) {
      $('#blockrBlockHeight').text(data.data.nb);
    });
  }

  function checkHeights() {
    var bciHeight = $('#bciBlockHeight').text();
    var blockrHeight = $('#blockrBlockHeight').text();
    if (!bciHeight || !blockrHeight ||
      heightPerRelay === bciHeight || heightPerRelay === blockrHeight) {
        $('#warnSync').hide();
    }
    else {
      $('#nodeBlockNum').text(web3.eth.blockNumber);
      $('#warnSync').show();
    }
  }

  function formatHash(bnHash) {
    var hash = bnHash.toString(16);
    return Array(64 - hash.length + 1).join('0') + hash;
  }

  function formatETHAddress(bnEthAddress) {
    var ethAddress = bnEthAddress.toString(16);
    return Array(40 - ethAddress.length + 1).join('0') + ethAddress;
  }

  $('#mainnetHeading').on('click', function(e) {
    $(this).find('li.header').removeClass('active').addClass('active');
    $('#testnetHeading').find('li.header').removeClass('active');
    updatePage('main');
  });

  $('#testnetHeading').on('click', function(e) {
    $(this).find('li.header').removeClass('active').addClass('active');
    $('#mainnetHeading').find('li.header').removeClass('active');
    updatePage('test');
  });

  getStatus('main');
});