
import React from 'react';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const DeleteProvinceModal = ({ 
  visible, 
  onConfirm, 
  onCancel, 
  province, 
  loading = false 
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
          <span>Confirm Delete Province</span>
        </div>
      }
      open={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Yes, Delete"
      cancelText="Cancel"
      okType="danger"
      confirmLoading={loading}
      width={450}
      centered
    >
      <div style={{ padding: '16px 0' }}>
        <p style={{ fontSize: '16px', marginBottom: '12px' }}>
          Are you sure you want to delete the province:
        </p>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '6px',
          border: '1px solid #d9d9d9',
          marginBottom: '16px'
        }}>
          <strong style={{ fontSize: '16px', color: '#1890ff' }}>
            "{province?.provinceName}"
          </strong>
          {province?.country?.countryName && (
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              Country: {province.country.countryName}
            </div>
          )}
        </div>
        <div style={{ 
          background: '#fff2f0', 
          border: '1px solid #ffccc7',
          borderRadius: '6px',
          padding: '12px'
        }}>
          <p style={{ 
            color: '#ff4d4f', 
            fontSize: '14px', 
            margin: 0,
            fontWeight: '500'
          }}>
            ⚠️ Warning: This action cannot be undone!
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteProvinceModal;
