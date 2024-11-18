<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { FilterMatchMode } from '@primevue/core/api'
import InputIcon from 'primevue/inputicon'
import IconField from 'primevue/iconfield'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import FileUpload from 'primevue/fileupload'
import { useLinkedinAccountService } from '@/services/LinkedinAccountService'
import { MainUtil } from '@/util/MainUtil'

const linkedinAccountArray = ref([])
const linkedinAccount = ref({})
const selectedLinkedinAccounts = ref([])
const dt = ref()
const toast = useToast()
const deleteAccountDialog = ref(false)
const deleteAccountsDialog = ref(false)
const linkedinAccountDialog = ref(false)
const changeStatusAccountsDialog = ref(false)
const changedStatus = ref(0)
const submitted = ref(false)
const {
  deleteOne,
  deleteBatch,
  fetchAll,
  changeStatusAccounts,
  create,
  update,
} = useLinkedinAccountService()

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const accountStatusType = ref([
  { label: 'Pasif', value: 0 },
  { label: 'Aktif', value: 1 },
])

onMounted(async () => {
  const result = await fetchAll()
  if (result.success) {
    linkedinAccountArray.value = result.response.data
    console.log(linkedinAccountArray.value)
  } else {
    MainUtil.showToast(
      toast,
      result.success ? 'success' : 'error',
      result.message,
    )
  }
})

const changeStatus = async data => {
  var newStatus = data.status
  if (newStatus === 0) {
    newStatus = 1
  } else {
    newStatus = 0
  }

  const result = await changeStatusAccounts([data.id], newStatus)

  if (result.success) {
    data.status = newStatus
  }

  //MainUtil.showToast(toast, result.success ? 'success' : 'error', result.message)
}

const confirmDeleteAccount = deletingItem => {
  linkedinAccount.value = deletingItem
  deleteAccountDialog.value = true
}

const deleteAccountLinkedin = async () => {
  const result = await deleteOne(linkedinAccount.value.id)

  if (result.success) {
    linkedinAccountArray.value = linkedinAccountArray.value.filter(
      val => val.id !== linkedinAccount.value.id,
    )
  }

  deleteAccountDialog.value = false
  linkedinAccount.value = {}

  MainUtil.showToast(
    toast,
    result.success ? 'success' : 'error',
    result.message,
  )
}

const confirmDeleteSelected = () => {
  deleteAccountsDialog.value = true
}

const deleteSelectedAccounts = async () => {
  var selectedIds = selectedLinkedinAccounts.value.map(data => data.id)
  const result = await deleteBatch(selectedIds)

  if (result.success) {
    linkedinAccountArray.value = linkedinAccountArray.value.filter(
      val => !selectedLinkedinAccounts.value.includes(val),
    )
  }
  deleteAccountsDialog.value = false
  selectedLinkedinAccounts.value = []

  MainUtil.showToast(
    toast,
    result.success ? 'success' : 'error',
    result.message,
  )
}

const confirmChangeStatusSelected = status => {
  changedStatus.value = status
  changeStatusAccountsDialog.value = true
}

const changeStatusSelectedAccounts = async () => {
  var selectedIds = selectedLinkedinAccounts.value.map(data => data.id)
  const result = await changeStatusAccounts(selectedIds, changedStatus.value)

  if (result.success) {
    linkedinAccountArray.value
      .filter(val => selectedLinkedinAccounts.value.includes(val))
      .forEach(element => {
        element.status = changedStatus.value
      })
  }

  changeStatusAccountsDialog.value = false
  selectedLinkedinAccounts.value = []

  MainUtil.showToast(
    toast,
    result.success ? 'success' : 'error',
    result.message,
  )
}

const openNew = () => {
  linkedinAccount.value = {}
  submitted.value = false
  linkedinAccountDialog.value = true
}

const hideDialog = () => {
  linkedinAccountDialog.value = false
  submitted.value = false
}

const save = async () => {
  submitted.value = true

  if (linkedinAccount.value.username?.trim()) {
    var result
    linkedinAccount.value.status = linkedinAccount.value.status.value
    if (linkedinAccount.value.id) {
      result = await update(linkedinAccount.value)
      if (result.success) {
        linkedinAccountArray.value[
          findIndexById(result.response.data.linkedinAccountDto.id)
        ] = result.response.data.linkedinAccountDto
      }
    } else {
      result = await create([linkedinAccount.value])
      if (result.success) {
        result.response.data.linkedinAccountList.forEach(element => {
          linkedinAccountArray.value.push(element)
        })
      }
    }
    linkedinAccountDialog.value = false
    linkedinAccount.value = {}
    MainUtil.showToast(
      toast,
      result.success ? 'success' : 'error',
      result.message,
    )
  }
}

const findIndexById = id => {
  return linkedinAccountArray.value.findIndex(item => item.id === id)
}

const edit = editingProduct => {
  linkedinAccount.value = { ...editingProduct }
  accountStatusType.value.forEach(element => {
    if (linkedinAccount.value.status === element.value) {
      linkedinAccount.value.status = element
    }
  })
  linkedinAccountDialog.value = true
}

const onUpload = event => {
  const reader = new FileReader()
  reader.onload = async e => {
    var parsedData = MainUtil.parseCSV(e.target.result)
    const result = await create(parsedData)
    if (result.success) {
      result.response.data.linkedinAccountList.forEach(element => {
        linkedinAccountArray.value.push(element)
      })
    }
    MainUtil.showToast(
      toast,
      result.success ? 'success' : 'error',
      result.message,
    )
  }
  reader.readAsText(event.files[0])
}
</script>
<template>
  <div class="card">
    <DataTable
      ref="dt"
      v-model:selection="selectedLinkedinAccounts"
      :value="linkedinAccountArray"
      dataKey="id"
      :paginator="true"
      :rows="10"
      :filters="filters"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[5, 10, 25]"
      currentPageReportTemplate="{first} - {last} / {totalRecords} Ham Veri"
      filterDisplay="menu"
      :globalFilterFields="['username']"
    >
      <template #header>
        <div class="flex justify-content-between flex-wrap">
          <div>
            <Button
              label="Yeni"
              icon="pi pi-plus"
              class="mr-2"
              @click="openNew"
            />
            <Button
              label="Sil"
              class="mr-2"
              icon="pi pi-trash"
              severity="danger"
              @click="confirmDeleteSelected"
              :disabled="!selectedLinkedinAccounts.length"
            />

            <Button
              label="Çoklu Pasif"
              class="mr-2"
              @click="confirmChangeStatusSelected(0)"
              severity="info"
              :disabled="!selectedLinkedinAccounts.length"
            />
            <Button
              label="Çoklu Aktif"
              class="mr-2"
              severity="info"
              @click="confirmChangeStatusSelected(1)"
              :disabled="!selectedLinkedinAccounts.length"
            />
          </div>
          <h2 class="m-0">Linkedin Hesap Listesi</h2>
          <div class="flex justify-content-between flex-wrap">
            <FileUpload
              mode="basic"
              :multiple="false"
              accept=".csv"
              :maxFileSize="1000000"
              label="İçe Aktar"
              chooseLabel="İçe Aktar"
              class="mr-2"
              :auto="true"
              :custom-upload="true"
              @uploader="onUpload"
            />
            <IconField class="ml-2">
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText
                v-model="filters['global'].value"
                placeholder="Arama..."
              />
            </IconField>
          </div>
        </div>
      </template>

      <Column
        selectionMode="multiple"
        style="width: 3rem"
        :exportable="false"
      />
      <Column field="username" header="Kullanıcı Adı" class="i-column" />
      <Column field="password" header="Şifre" class="i-column" />
      <Column field="status" header="Durumu" class="i-column">
        <template #body="{ data }">
          <Tag
            :value="MainUtil.formatAccountStatus(data.status)"
            :severity="MainUtil.getSeverity(data.status)"
          />
        </template>
      </Column>
      <Column :exportable="false" class="i-column">
        <template #body="slotProps">
          <Button
            icon="pi pi-pencil"
            class="mr-2"
            text
            raised
            rounded
            @click="edit(slotProps.data)"
          />

          <Button
            icon="pi pi-trash"
            severity="danger"
            class="mr-2"
            text
            raised
            rounded
            @click="confirmDeleteAccount(slotProps.data)"
          />

          <ToggleSwitch
            id="changeStatus"
            class="m-1"
            style="margin-top: 15px"
            :modelValue="slotProps.data.status === 1"
            v-on:change="changeStatus(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>
    <Toast position="bottom-right" />

    <Dialog
      v-model:visible="deleteAccountsDialog"
      :style="{ width: '450px' }"
      header="Silme işlemi onayı"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span v-if="linkedinAccount"
          >Seçilen kayıtlar silinecektir, onaylıyor musunuz?</span
        >
      </div>
      <template #footer>
        <Button
          label="Hayır"
          icon="pi pi-times"
          text
          @click="deleteAccountsDialog = false"
        />
        <Button
          label="Evet"
          icon="pi pi-check"
          text
          @click="deleteSelectedAccounts"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="changeStatusAccountsDialog"
      :style="{ width: '450px' }"
      header="Durum değiştirme işlemi onayı"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span v-if="changedStatus === 1"
          >Seçilen kayıtlar aktif yapılacaktır, onaylıyor musunuz?</span
        >
        <span v-else
          >Seçilen kayıtlar pasif yapılacaktır, onaylıyor musunuz?</span
        >
      </div>
      <template #footer>
        <Button
          label="Hayır"
          icon="pi pi-times"
          text
          @click="changeStatusAccountsDialog = false"
        />
        <Button
          label="Evet"
          icon="pi pi-check"
          text
          @click="changeStatusSelectedAccounts"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="linkedinAccountDialog"
      :style="{ width: '550px' }"
      header="Linkedin Hesap Bilgisi"
      :modal="true"
    >
      <div class="w-full">
        <div class="field grid">
          <label class="col-3" for="username"> Kullanıcı Adı </label>
          <div class="col-9">
            <InputText
              id="username"
              v-model.trim="linkedinAccount.username"
              required="true"
              autofocus
              :invalid="submitted && !linkedinAccount.username"
              fluid
            />
          </div>
        </div>
        <div class="field grid">
          <label for="password" class="col-3">Şifre</label>
          <div class="col-9">
            <InputText
              id="target"
              v-model.trim="linkedinAccount.password"
              required="true"
              :invalid="submitted && !linkedinAccount.password"
              fluid
            />
          </div>
        </div>
        <div class="field grid">
          <label for="type" class="col-3">Durumu</label>
          <div class="col-9">
            <Select
              id="type"
              v-model="linkedinAccount.status"
              :options="accountStatusType"
              optionLabel="label"
              placeholder="Durumu"
              fluid
            ></Select>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="İptal" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Kaydet" icon="pi pi-check" @click="save" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteAccountDialog"
      :style="{ width: '450px' }"
      header="Silme işlemi onayı"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" severity="danger" />
        <span v-if="linkedinAccount"
          >İlgili kaydı silmeyi onaylıyor musunuz? Kullanıcı Adı:
          <b>{{ linkedinAccount.username }}</b></span
        >
      </div>
      <template #footer>
        <Button
          label="Hayır"
          icon="pi pi-times"
          text
          @click="deleteAccountDialog = false"
        />
        <Button
          label="Evet"
          icon="pi pi-check"
          @click="deleteAccountLinkedin"
        />
      </template>
    </Dialog>
  </div>
</template>

<style></style>
