import * as crypto from 'crypto';
import * as moment from 'moment';
import * as QueryString from 'qs';
import { Order, OrderStatus } from 'src/entities/order.entity';
import { OrdersService } from 'src/orders/orders.service';
import { DataSource, Repository } from 'typeorm';

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  VnpayLog,
  VnpayTransactionStatusEnum,
} from '../entities/vnpay-log.entity';

@Injectable()
export class VnpayService {
  constructor(
    @InjectRepository(VnpayLog)
    private readonly vnpayLogRepository: Repository<VnpayLog>,
    private readonly dataSource: DataSource,
    private readonly ordersService: OrdersService,
  ) {}

  sortObject(obj: any) {
    let sorted: any = {};
    let str: string[] = [];
    let key;
    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  async createVNPayLink({
    ip,
    orderNumber,
    amount,
  }: {
    ip: string;
    orderNumber: string;
    amount: number;
  }) {
    try {
      const order = await this.ordersService.fineOrderByCondition({
        orderNumber: orderNumber,
      });

      if (!order) {
        throw new BadRequestException('Không tìm thấy đơn hàng');
      }

      let date = moment();
      let createDate = date.clone();

      let expiryDate = date.clone().add(15, 'minutes');
      let tmnCode = String(process.env.VNPAY_TMNCODE);
      if (!tmnCode)
        throw new BadRequestException(
          'VNPAY_TMNCODE_not_found',
          'update lại env đê',
        );

      let secretKey = String(process.env.VNPAY_SECRET_KEY);
      if (!secretKey)
        throw new BadRequestException(
          'VNPAY_SECRET_KEY_not_found',
          'update lại env đê',
        );

      let vnpUrl = String(process.env.VNPAY_URL);
      if (!vnpUrl)
        throw new BadRequestException(
          'VNPAY_URL_not_found',
          'update lại env đê',
        );

      let callback_url = `${String(process.env.VNPAY_CALLBACK_URL)}/tracking?order=${order.orderNumber}`;
      if (!callback_url)
        throw new BadRequestException(
          'VNPAY_CALLBACK_URL_not_found',
          'update lại env đê',
        );

      const dataLog = this.vnpayLogRepository.create({
        orderId: order.id,
        orderNumber: String(order.orderNumber),
        vnpTxnRef: `${createDate}_${order.id}`,
        amount: amount.toString() || order.finalAmount.toString(),
        requestTime: createDate.toDate(),
        responseTime: expiryDate.toDate(),
        ipAddress: ip,
      });

      const saveLog = await this.vnpayLogRepository.save(dataLog);

      let currCode = 'VND';
      let vnp_Params: any = {};
      vnp_Params['vnp_Version'] = '2.1.0';
      vnp_Params['vnp_Command'] = 'pay';
      vnp_Params['vnp_TmnCode'] = tmnCode;
      // vnp_Params['vnp_Merchant'] = ''
      vnp_Params['vnp_Locale'] = 'vi';
      vnp_Params['vnp_CurrCode'] = currCode;
      vnp_Params['vnp_TxnRef'] = `${saveLog.id}&${createDate}`;
      vnp_Params['vnp_OrderInfo'] =
        `Thanh toán đơn hàng ${saveLog.orderNumber}`;
      vnp_Params['vnp_OrderType'] = 'other';
      vnp_Params['vnp_Amount'] = Number(saveLog.amount) * 100;
      vnp_Params['vnp_ReturnUrl'] = callback_url;
      vnp_Params['vnp_IpAddr'] = ip;
      vnp_Params['vnp_CreateDate'] = createDate
        .clone()
        .format('YYYYMMDDHHmmss');
      vnp_Params['vnp_ExpireDate'] = expiryDate
        .clone()
        .format('YYYYMMDDHHmmss');

      vnp_Params = this.sortObject(vnp_Params);

      console.log(vnp_Params, 'vnp_Params');

      let signData = QueryString.stringify(vnp_Params, { encode: false });
      let hmac = crypto.createHmac('sha512', secretKey);
      let signed = hmac.update(Buffer.from(signData)).digest('hex');

      vnp_Params['vnp_SecureHash'] = signed;
      vnpUrl += '?' + QueryString.stringify(vnp_Params, { encode: false });
      return {
        paymentUrl: vnpUrl,
      };
    } catch (error) {
      console.log('error', error);
      throw new BadRequestException('error');
    }
  }

  async handleCheckIpn(query) {
    console.log(query, 'query');
    try {
      let vnp_Params = query;
      let secureHash = vnp_Params['vnp_SecureHash'];

      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      vnp_Params = this.sortObject(vnp_Params);
      let secretKey = process.env.VNPAY_SECRET_KEY as string;
      let signData = QueryString.stringify(vnp_Params, { encode: false });
      let hmac = crypto.createHmac('sha512', secretKey);
      let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');

      if (secureHash === signed) {
        // log order
        const txnRef = decodeURIComponent(vnp_Params['vnp_TxnRef']);
        let logId = txnRef.split('&')[0];
        const log = await this.vnpayLogRepository.findOne({
          where: {
            id: logId,
          },
          relations: {
            order: true,
          },
        });

        if (!log) {
          throw new BadRequestException('order_not_found');
        }

        let rspCode = vnp_Params['vnp_ResponseCode'];

        if (rspCode === '24') {
          log.responseCode = rspCode;
          log.responseTime = new Date();
          log.success = false;
          log.rawResponse = JSON.stringify(vnp_Params);
          log.vnpTransactionNo = vnp_Params['vnp_TransactionNo'];
          log.vnpSecureHash = vnp_Params['vnp_SecureHash'];
          log.transactionStatus = VnpayTransactionStatusEnum.FAILED;
          log.description = 'Khách hàng hủy giao dịch';
          await this.vnpayLogRepository.save(log);

          return {
            rspCode: rspCode,
            message: log.description,
          };
        }

        const amountPaymentLog = log.amount;
        const dateLog = new Date(vnp_Params['vnp_PayDate']);
        if (Number(vnp_Params['vnp_PayDate']) > dateLog.getTime()) {
          log.responseCode = rspCode;
          log.responseTime = new Date();
          log.success = false;
          log.rawResponse = JSON.stringify(vnp_Params);
          log.vnpTransactionNo = vnp_Params['vnp_TransactionNo'];
          log.vnpSecureHash = vnp_Params['vnp_SecureHash'];
          log.transactionStatus = VnpayTransactionStatusEnum.FAILED;
          log.description =
            'Đã nhận tiền nhưng giao dịch không tồn tại hoặc hết hạn';
          await this.vnpayLogRepository.save(log);
          return {
            rspCode: rspCode,
            message: log.description,
          };
        }

        if (
          Number(vnp_Params['vnp_Amount']) / 100 !==
          Number(amountPaymentLog)
        ) {
          log.responseCode = rspCode;
          log.responseTime = new Date();
          log.success = false;
          log.rawResponse = JSON.stringify(vnp_Params);
          log.vnpTransactionNo = vnp_Params['vnp_TransactionNo'];
          log.vnpSecureHash = vnp_Params['vnp_SecureHash'];
          log.transactionStatus = VnpayTransactionStatusEnum.FAILED;
          log.description = 'Số tiền giao dịch không đúng!';
          await this.vnpayLogRepository.save(log);
          console.log(log, '<<<<< log amout');

          return {
            rspCode: rspCode,
            message: log.description,
          };
        }

        log.responseCode = rspCode;
        log.responseTime = new Date();
        log.success = true;
        log.rawResponse = JSON.stringify(vnp_Params);
        log.vnpTransactionNo = vnp_Params['vnp_TransactionNo'];
        log.vnpSecureHash = vnp_Params['vnp_SecureHash'];
        log.transactionStatus = VnpayTransactionStatusEnum.SUCCESS;
        log.description = 'Giao dịch thành công';
        log.order.orderStatus = OrderStatus.PENDING;
        console.log(log, '<<<<< log success');
        // update order status
        await this.dataSource.transaction(
          async (transactionalEntityManager) => {
            await transactionalEntityManager.update(
              Order,
              {
                id: log.orderId,
              },
              {
                orderStatus: OrderStatus.PENDING,
                depositAmount: Number(log.amount),
                remainingAmount:
                  Number(log.order.finalAmount) - Number(log.amount),
                notes: `Đã thanh toán ${Number(log.amount)} VNĐ`,
              },
            );

            await transactionalEntityManager.save(VnpayLog, log);
          },
        );

        return { RspCode: '00', Message: 'success' };
      } else {
        console.log('32434');
        return { RspCode: '97', Message: 'Invalid signature' };
      }
    } catch (error) {
      console.log(error, '<<< E2423');
      return { RspCode: '97', Message: 'Invalid signature' };
    }
  }
}
