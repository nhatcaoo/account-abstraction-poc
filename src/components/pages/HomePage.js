import React from 'react'; // Add this import statement
import { SmileOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Form, Input, InputNumber, Modal, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import '../../App.css'

const layout = {
  labelCol: {
    span: 8,
  },
  wrapperCol: {
    span: 16,
  },
};
const tailLayout = {
  wrapperCol: {
    offset: 8,
    span: 16,
  },
};
// reset form fields when modal is form, closed
const useResetFormOnCloseModal = ({ form, open }) => {
  const prevOpenRef = useRef();
  useEffect(() => {
    prevOpenRef.current = open;
  }, [open]);
  const prevOpen = prevOpenRef.current;
  useEffect(() => {
    if (!open && prevOpen) {
      form.resetFields();
    }
  }, [form, prevOpen, open]);
};
const ModalForm = ({ open, onCancel }) => {
  const [form] = Form.useForm();
  useResetFormOnCloseModal({
    form,
    open,
  });
  const onOk = () => {
    form.submit();
  };
  return (
    <Modal title="Item information" open={open} onOk={onOk} onCancel={onCancel}>
      <Form form={form} layout="vertical" name="itemForm">
        <Form.Item
          name="address"
          label="address"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="id"
          label="id"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <InputNumber />
        </Form.Item>
        <Form.Item
          name="quantity"
          label="quantity"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <InputNumber />
        </Form.Item>
      </Form>
    </Modal>
  );
};
const HomePage = () => {
  const [open, setOpen] = useState(false);
  const showUserModal = () => {
    setOpen(true);
  };
  const hideUserModal = () => {
    setOpen(false);
  };
  const onFinish = (values) => {
    console.log('Finish:', values);
  };
  return (
    <div className="text-center m-5-auto">
      <h2>Sign in to us</h2>

      <Form.Provider
        onFormFinish={(name, { values, forms }) => {
          if (name === 'itemForm') {
            const { basicForm } = forms;
            const items = basicForm.getFieldValue('items') || [];
            basicForm.setFieldsValue({
              items: [...items, values],
            });
            setOpen(false);
          }
        }}
      >
        <Form
          {...layout}
          name="basicForm"
          onFinish={onFinish}
          style={{
            maxWidth: 600,
          }}
        >
          <Form.Item
            name="target"
            label="Target"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Item list"
            shouldUpdate={(prevValues, curValues) => prevValues.items !== curValues.items}
          >
            {({ getFieldValue }) => {
              const items = getFieldValue('items') || [];
              return items.length ? (
                <ul>
                  {items.map((item) => (
                    <li key={item.name} className="item">
                      <Avatar icon={<UserOutlined />} />
                      {item.address} - {item.id} - {item.quantity}
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography.Text className="ant-form-text" type="secondary">
                  ( <SmileOutlined /> No item yet. )
                </Typography.Text>
              );
            }}
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Button htmlType="submit" type="primary">
              Submit
            </Button>
            <Button
              htmlType="button"
              style={{
                margin: '0 8px',
              }}
              onClick={showUserModal}
            >
              Add Item
            </Button>
          </Form.Item>
        </Form>

        <ModalForm open={open} onCancel={hideUserModal} />
      </Form.Provider>
    </div>

  );

};
export default HomePage;