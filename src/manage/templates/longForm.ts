/*
 * @文件描述: 生成大表单页面
 * @公司: thundersdata
 * @作者: 陈杰
 * @Date: 2020-05-08 16:05:30
 * @LastEditors: 黄姗姗
 * @LastEditTime: 2020-05-25 09:48:07
 */
import { createFormComponentsByType, transformFormItemLines, generateRules, generateBreadcrumbs } from './util';
import { CardItemProps, FormItemProps } from '../../../interfaces/common';

export interface Payload {
  cards: CardItemProps[];
  initialFetch?: string[];
  submitFetch?: string[];
  menu: string;
}

export default function generateLongFormCode(payload: Payload): string {
  if (payload && payload.cards) {
    const { cards = [], initialFetch, submitFetch, menu } = payload;
    const formItems = cards.reduce((acc, curr) => acc.concat(curr.formItems), [] as FormItemProps[]);
    const item = formItems.find(item => item.type === 'upload');

    const breadcrumbs = generateBreadcrumbs(menu);

    const code = `
      import React, { useCallback ${item ? ', useState' : ''} } from 'react';
      import {
        Form,
        Button,
        Card,
        Row,
        Col,
        Input,
        DatePicker,
        TimePicker,
        Cascader,
        InputNumber,
        Radio,
        Checkbox,
        Switch,
        Slider,
        Select,
        TreeSelect,
        Upload,
        Rate,
        message,
        Spin,
      } from 'antd';
      import { history } from 'umi';
      import { useRequest } from 'ahooks';
      import { Store } from 'antd/es/form/interface';
      import Title from '@/components/Title';
      import FooterToolbar from '@/components/FooterToolbar';
      import useSpinning from '@/hooks/useSpinning';
      ${breadcrumbs.length > 1 && `import CustomBreadcrumb from '@/components/CustomBreadcrumb';`}

      const colLayout = {
        lg: {
          span: 8
        },
        md: {
          span: 12
        },
        sm: {
          span: 24
        }
      }

      export default () => {
        const [form] = Form.useForm();
        const { tip, setTip } = useSpinning();
        ${item ? `const [submitBtnDisabled, setSubmitBtnDisabled] = useState(false);` : ''}

        const { id } = history.location.query;

        const fetchDetail = () => {
          if (id) {
            setTip('加载详情中，请稍候...');
            return API.${initialFetch && initialFetch.length === 3 ? `${initialFetch[0]}.${initialFetch[1]}.${
              initialFetch[2].split('-')[0]
            }` : 'recruitment.person.getPerson'}.fetch(
              { personCode: id },
            );
          }
          return false;
        };

        const { loading } = useRequest(fetchDetail, {
          refreshDeps: [id],
          onSuccess: data => {
            const values = {
              ...data
            };
            form.setFieldsValue(values);
          }
        });

        const submit = (values: Store) => {
          setSpinning(true);
          setTip('数据保存中，请稍候...');

          const payload = {
            ...values,
          };

          return API.${submitFetch && submitFetch.length === 3 ? `${submitFetch[0]}.${submitFetch[1]}.${
            submitFetch[2].split('-')[0]
          }` : 'recruitment.person.addPerson'}.fetch(payload);
        };

        const { run: handleFinish, loading: submitting } = useRequest(submit, {
          manual: true,
          onSuccess: () => {
            message.success('保存成功');
          },
        });

        return (
          <Spin spinning={loading && submitting} tip={tip}>
            <CustomBreadcrumb list={${breadcrumbs}} />
            <Form form={form} onFinish={handleFinish} layout="vertical">
              ${cards
                .map(card => {
                  const { title = '', formItems = [] } = card;
                  const cols = 3;
                  // 把formItems分成3列
                  const formItemLines = transformFormItemLines(formItems, cols);

                  return `
                  <Card title={<Title text="${title}" />} style={{ marginBottom: 16 }}>
                    ${formItemLines
                      .map(line => {
                        return `
                        <Row gutter={16}>
                          ${line
                            .map(formItem => {
                              const {
                                label,
                                name,
                                type,
                                required = false,
                                customRules = '',
                                ...restProps
                              } = formItem;
                              const rules = generateRules(customRules as string, required as boolean);
                              return `
                                <Col {...colLayout}>
                                  <Form.Item
                                    label="${label}"
                                    name="${name}"
                                    ${required ? `required` : ``}
                                    ${rules !== '[]' ? `rules={${rules}}` : ''}
                                    ${type === 'upload' ? `
                                    valuePropName="fileList"
                                    getValueFromEvent={e => {
                                      if (Array.isArray(e)) {
                                        return e;
                                      }
                                      return e && e.fileList;
                                    }}` : ''}
                                  >
                                    ${createFormComponentsByType(type, restProps)}
                                  </Form.Item>
                                </Col>
                              `;
                            })
                            .join('')}
                        </Row>
                      `;
                      })
                      .join('')}
                  </Card>
                `;
                })
                .join('')}
              <FooterToolbar>
                <Button
                  type="primary"
                  onClick={() => form.submit()}
                  loading={submitting}
                  ${item ? 'disabled={submitBtnDisabled}' : ''}
                >
                  提交
                </Button>
              </FooterToolbar>
            </Form>
          </Spin>
        );
      };
    `;
    return code;
  }
  return '';
}
