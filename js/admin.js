// 取得訂單資料、渲染訂單 OK
// 刪除全部訂單並重新渲染 OK
// 刪除特定訂單並重新渲染 OK
// 更改訂單狀態 未處理 => 已處理
// 圖表: 取出銷售最好的前三名及數量 整理成陣列

// UID
const api_path = 'hsinhui';
const token = 'h3Vxb7Y0dZbtSXddEsCH5ZY3omb2';
// 訂單資料
let orderList = [];

// DOM
const orderListEl = document.querySelector('.orderList');
const discardAllBtn = document.querySelector('.discardAllBtn');
// 取得訂單列表
getOrderList();
function getOrderList() {
  axios
    .get(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`, {
      headers: {
        Authorization: token
      }
    })
    .then(function (response) {
      orderList = response.data.orders;
      renderOrderList();
      renderChart();
    })
    .catch(function (err) {
      console.log(err);
      alert('網頁怪怪的，請找工程師');
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
    str += `
    <tr>
      <td>${item.id}</td>
      <td>
        <p>${item.user.name}</p>
        <p>${item.user.tel}</p>
      </td>
      <td>${item.user.address}</td>
      <td>${item.user.email}</td>
      <td>
        <p>${item.products[0].title}</p>
      </td>
      <td>${orderTime}</td>
      <td class="orderStatus">
        <a href="#" data-id="${item.id}">${item.paid ? '已處理' : '未處理'}</a>
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
  axios
    .delete(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`, {
      headers: {
        Authorization: token
      }
    })
    .then(function (response) {
      // console.log(response.data);
      alert('成功清除全部訂單');
      getOrderList();
    })
    .catch(function (err) {
      console.log(err);
      alert('已經沒有訂單囉');
    });
}

// 刪除特定訂單
orderListEl.addEventListener('click', deleteOrder);
function deleteOrder(e) {
  if (e.target.getAttribute('value') !== '刪除') {
    return;
  }
  let orderId = e.target.dataset.id;
  deleteOrderItem(orderId);
}
function deleteOrderItem(orderId) {
  axios
    .delete(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders/${orderId}`, {
      headers: {
        Authorization: token
      }
    })
    .then(function (response) {
      getOrderList();
    })
    .catch(function (err) {
      console.log(err);
    });
}
// 修改訂單狀態(未處理 => 已處理)
orderListEl.addEventListener('click', orderStatus);
function orderStatus(e) {
  e.preventDefault();
  if (e.target.nodeName !== 'A') {
    return;
  }
  let orderId = e.target.dataset.id;
  changeOrderStatus(orderId);
}
function changeOrderStatus(orderId) {
  axios
    .put(
      `https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`,
      {
        data: {
          id: orderId,
          paid: true
        }
      },
      {
        headers: {
          Authorization: token
        }
      }
    )
    .then(function (response) {
      getOrderList();
    })
    .catch(function (err) {
      console.log(err);
    });
}

// 圖表資料整理

function renderChart() {
  let chartDataAry = [];

  // 將所有備購買的產品名稱及數量整理在物件內
  let totalPriceObj = {};
  orderList.forEach((item) => {
    item.products.forEach((productsItem) => {
      if (totalPriceObj[productsItem.category] == undefined) {
        totalPriceObj[productsItem.category] = productsItem.price;
      } else {
        totalPriceObj[productsItem.category] += productsItem.price;
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
