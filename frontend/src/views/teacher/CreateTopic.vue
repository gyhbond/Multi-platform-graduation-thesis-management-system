<template>
  <div class="create-topic-container">
    <div class="header">
      <h2>{{ isEdit ? '编辑课题' : '发布新课题' }}</h2>
    </div>

    <el-form :model="topicForm" :rules="rules" ref="topicFormRef" label-width="100px" class="topic-form">
      <el-form-item label="课题名称" prop="title">
        <el-input v-model="topicForm.title" placeholder="请输入课题名称" />
      </el-form-item>
      <!-- rows属性本质是HTML标准中<textarea>元素的属性，用于控制文本输入框的默认高度： -->
      <el-form-item label="课题描述" prop="description">
        <el-input v-model="topicForm.description" type="textarea" :rows="4" placeholder="请输入课题描述" />
      </el-form-item>

      <el-form-item label="选题要求" prop="requirements">
        <el-input v-model="topicForm.requirements" type="textarea" :rows="4" placeholder="请输入选题要求" />
      </el-form-item>

      <el-form-item label="最大选题人数" prop="maxStudents">
        <el-input-number v-model="topicForm.maxStudents" :min="1" :max="5" />
      </el-form-item>

      <el-form-item label="截止日期" prop="deadline">
        <!-- :disabled-date	指定一个函数，返回 true 时禁用对应日期（如禁止选择过去日期）
         :default-time	设置选择日期后的默认时间（如自动填充为 23:59:59） -->
        <el-date-picker v-model="topicForm.deadline" type="datetime" placeholder="选择截止日期" :disabled-date="disabledDate"
          :default-time="defaultTime" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit">{{ isEdit ? '保存' : '发布' }}</el-button>
        <el-button @click="goBack">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createTopic, updateTopic, getTopicDetail } from '../../api/topics'

const router = useRouter()
const route = useRoute()
const topicFormRef = ref(null)
const isEdit = ref(false)

const topicForm = reactive({
  title: '',
  description: '',
  requirements: '',
  maxStudents: 1,
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 默认30天后
})

const rules = {
  title: [
    { required: true, message: '请输入课题名称', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入课题描述', trigger: 'blur' }
  ],
  requirements: [
    { required: true, message: '请输入选题要求', trigger: 'blur' }
  ],
  maxStudents: [
    { required: true, message: '请设置最大选题人数', trigger: 'change' }
  ],
  deadline: [
    { required: true, message: '请选择截止日期', trigger: 'change' }
  ]
}

// 日期选择器配置，禁用今天之前的日期
const disabledDate = (time) => {  //time 参数是用户尝试选择的日期对应的 Date 对象。
  return time.getTime() < Date.now()  //time.getTime()是1970年1月1日0时0分0秒到所选时间的毫秒数,Date.now()是1970年1月1日0时0分0秒到当前时间的毫秒数
}
//当用户仅选择日期（未手动选择时间）时，自动填充时间为 23:59:59。
// 日期部分被忽略：2000-01-01 仅用于提取时间部分（23: 59: 59），实际日期以用户选择的日期为准。
// 2000：年份（无实际作用）
// 0：月份（0 代表 1 月）
// 1：日期（1 号）
// 23：小时（23 点）  
// 59：分钟（59 分）
// 59：秒（59 秒）
const defaultTime = new Date(2000, 0, 1, 23, 59, 59)

// 提交表单前格式化日期
const handleSubmit = async () => {
  if (!topicFormRef.value) return

  await topicFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const formData = {
          ...topicForm,
          //   功能：将 Date 对象转换为符合国际标准的字符串（UTC 时间）。
          //   格式：YYYY- MM - DDTHH: mm: ss.sssZ 示例：2023 - 10-05T14: 30:00.000Z
          // YYYY - MM - DD：年 - 月 - 日
          // T：日期与时间的分隔符
          // HH: mm: ss.sss：时: 分: 秒.毫秒
          // Z：表示 UTC 时区（协调世界时）
          deadline: topicForm.deadline.toISOString() // 确保日期格式正确
        }

        if (isEdit.value) {
          await updateTopic(route.query.id, formData)
        } else {
          await createTopic(formData)
        }
        ElMessage.success(isEdit.value ? '更新成功' : '发布成功')
        goBack()
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

// 返回列表页
const goBack = () => {
  router.push('/teacher/topics')
}

// 如果是编辑模式,获取课题详情(即isEdit为true)
const fetchTopicDetail = async (id) => {
  try {
    const response = await getTopicDetail(id)
    if (response.success && response.data) {
      // 处理日期字段
      const topicData = {
        ...response.data,
        deadline: new Date(response.data.deadline)
      }
      Object.assign(topicForm, topicData)
    } else {
      throw new Error(response.message || '获取课题详情失败')
    }
  } catch (error) {
    console.error('获取课题详情失败:', error)
    ElMessage.error(error.message || '获取课题详情失败')
    goBack()
  }
}

onMounted(() => {
  const id = route.query.id
  if (id) {
    isEdit.value = true
    fetchTopicDetail(id)
  }
})
</script>

<style scoped>
.create-topic-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}

.topic-form {
  max-width: 800px;
}
</style>