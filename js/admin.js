// 取得訂單資料、渲染訂單 OK
// 刪除全部訂單並重新渲染 OK
// 刪除特定訂單並重新渲染 OK
// 更改訂單狀態 未處理 => 已處理
// 圖表: 取出銷售最好的前三名及數量 整理成陣列

// UID
const api = 'https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin';
const api_path = 'hsinhui';
const token = 'h3Vxb7Y0dZbtSXddEsCH5ZY3omb2';
const config = {
  headers: {
    Authorization: token
  }
};
// 訂單資料
let orderList = [];

// DOM
const orderListEl = document.querySelector('.orderList');
const discardAllBtn = document.querySelector('.discardAllBtn');
const noOrderMsg = document.querySelector('.noOrderMsg');
const chartOption = document.querySelector('.chartOption');
const chartTitle = document.querySelector('.js-chartTitle');
// 取得訂單列表
getOrderList();

function getOrderList() {
  axios
    .get(`${api}/${api_path}/orders`, config)
    .then(function (response) {
      orderList = response.data.orders;
      renderOrderList();
      renderChart();
      chartOption.addEventListener('change', changeChart);
    })
    .catch(function (err) {
      console.log(err);
      Swal.fire('網頁怪怪的，請找工程師');
    });
}
//渲染訂單列表
function renderOrderList() {
  let timestamp;
  let str = '';
  orderList.forEach((item) => {
    timestamp = item.createdAt;
    let date = new Date(timestamp * 1000);
    let orderTime = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    // 先將購買的產品陣列組好字串 (產品x數量)
    let productsStr = '';
    item.products.forEach((productsItem) => {
      productsStr += `<p>${productsItem.title} x ${productsItem.quantity}</p>`;
    });
    let orderStatus = '';
    if (item.paid == false) {
      orderStatus = '未處理';
    } else {
      orderStatus = '已處理';
    }
    str += `
    <tr>
      <td >${item.id}</td>
      <td>
        <p>${item.user.name}</p>
        <p>${item.user.tel}</p>
      </td>
      <td>${item.user.address}</td>
      <td>${item.user.email}</td>
      <td>
        ${productsStr}
      </td>
      <td>${orderTime}</td>
      <td class="orderStatus">
        <a href="#" class="js-status" data-id="${item.id}" data-status="${item.paid}">${orderStatus}</a>
      </td>
      <td>
        <input type="button" data-id="${item.id}" class="delSingleOrder-Btn" value="刪除" />
      </td>
    </tr>`;
  });
  orderListEl.innerHTML = str;
}

// 刪除全部訂單
discardAllBtn.addEventListener('click', deleteAllOrder);
function deleteAllOrder(e) {
  e.preventDefault();
  if (orderList.length === 0) {
    Swal.fire('已經沒有訂單囉');
    return;
  }
  Swal.fire({
    title: '確定移除全部訂單?',
    showCancelButton: true,
    cancelButtonText: `取消`,
    confirmButtonText: `確定`
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire('成功移除!', '', 'success');
      axios
        .delete(`${api}/${api_path}/orders`, config)
        .then(function (response) {
          // console.log(response.data);
          getOrderList();
        })
        .catch(function (err) {
          console.log(err);
        });
    }
  });
}

// 刪除特定訂單
orderListEl.addEventListener('click', orderListEvent);
function orderListEvent(e) {
  e.preventDefault();
  let orderId = e.target.dataset.id;
  if (e.target.getAttribute('value') == '刪除') {
    deleteOrderItem(orderId);
    return;
  }
  if (e.target.getAttribute('class') == 'js-status') {
    let status = e.target.dataset.status; //回傳的是字串 'true'/'false'
    changeOrderStatus(orderId, status);
  }
}
function deleteOrderItem(orderId) {
  Swal.fire({
    title: '確定移除此訂單?',
    showCancelButton: true,
    cancelButtonText: `取消`,
    confirmButtonText: `確定`
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire('成功移除!', '', 'success');
      axios
        .delete(`${api}/${api_path}/orders`, config)
        .then(function (response) {
          getOrderList();
        })
        .catch(function (err) {
          console.log(err);
        });
    }
  });
}
// 修改訂單狀態(自由切換已處理&未處理)
function changeOrderStatus(orderId, paidStatus) {
  let newStatus;
  // 轉換狀態 => 當原有的狀態是true，點擊過後變成false
  if (paidStatus == 'true') {
    newStatus = false;
  } else {
    newStatus = true;
  }
  axios
    .put(
      `${api}/${api_path}/orders`,
      {
        data: {
          id: orderId,
          paid: newStatus
        }
      },
      config
    )
    .then(function (response) {
      Swal.fire('修改訂單成功');
      getOrderList();
    })
    .catch(function (err) {
      console.log(err);
    });
}

// 圖表資料整理

function renderChart() {
  // 若訂單無資料即顯示"目前沒有訂單"，顯示圖表將無資料，所以圖表會空白(不用return)
  if (orderList.length === 0) {
    noOrderMsg.textContent = '目前沒有訂單';
  }
  let chartDataAry = [];
  // 將所有被購買的產品名稱及數量整理在物件內
  let totalPriceObj = {};
  orderList.forEach((item) => {
    item.products.forEach((productsItem) => {
      if (totalPriceObj[productsItem.category] == undefined) {
        totalPriceObj[productsItem.category] = productsItem.price * productsItem.quantity;
      } else {
        totalPriceObj[productsItem.category] += productsItem.price * productsItem.quantity;
      }
    });
  });
  let categoryAry = Object.keys(totalPriceObj);
  categoryAry.forEach((item) => {
    let newAry = [];
    newAry.push(item);
    newAry.push(totalPriceObj[item]);
    chartDataAry.push(newAry);
  });
  // C3.js
  let chart = c3.generate({
    bindto: '#chart', // HTML 元素綁定
    data: {
      type: 'pie',
      columns: chartDataAry,
      colors: {
        床架: '#ED7D31',
        收納: '#5A9BD5',
        窗簾: '#FFC000'
      }
    }
  });
}

function renderChartProducts() {
  if (orderList.length === 0) {
    noOrderMsg.textContent = '目前沒有訂單';
  }
  let chartProductData = []; //目標資料[[第一名,金額],[第二名,金額],[第三名,金額],[其他,金額] ]
  let productObj = {};
  orderList.forEach((item) => {
    item.products.forEach((productItem) => {
      if (productObj[productItem.title] === undefined) {
        productObj[productItem.title] = productItem.price * productItem.quantity;
      } else {
        productObj[productItem.title] += productItem.price * productItem.quantity;
      }
    });
  });
  // console.log(productObj);
  let productAry = Object.keys(productObj);
  productAry.forEach((item) => {
    let ary = [];
    ary.push(item);
    ary.push(productObj[item]);
    chartProductData.push(ary);
  });
  // 排序資料
  chartProductData.sort((a, b) => {
    return b[1] - a[1];
  });
  // 將第四筆資料以後歸納於其他，並將金額全部加總
  if (chartProductData.length > 3) {
    let otherTotalPrice = 0;
    chartProductData.forEach(function (item, index, ary) {
      if (index > 2) {
        otherTotalPrice += ary[index][1]; //將第三筆以後陣列內的金額加總
      }
    });
    chartProductData.splice(3, chartProductData.length - 1); //刪除原本第三筆以後的陣列資料
    chartProductData.push(['其他', otherTotalPrice]);
  }
  // C3.js
  let chart = c3.generate({
    bindto: '#chart', // HTML 元素綁定
    data: {
      type: 'pie',
      columns: chartProductData,
      color: {
        pattern: ['#301E5F', '#5434A7', '#9D7FEA', '#DACBFF']
      }
    }
  });
}
//更改圖表
function changeChart() {
  if (chartOption.value === '全產品類別營收比重圖表') {
    renderChart();
    chartTitle.textContent = '全產品類別營收比重圖表';
  } else {
    renderChartProducts();
    chartTitle.textContent = '全產品品項營收比重圖表';
  }
}
