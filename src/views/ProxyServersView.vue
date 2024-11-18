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

import { useProxyServerAccountService } from '@/services/ProxyServerService'
import { MainUtil } from '@/util/MainUtil'

const proxyServerArray = ref([])
const proxyServer = ref({})
const selectedProxyServers = ref([])
const dt = ref()
const toast = useToast()
const deleteAccountDialog = ref(false)
const deleteAccountsDialog = ref(false)
const proxyServerDialog = ref(false)
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
} = useProxyServerAccountService()

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const proxyType = ref(['SOCKS4', 'SOCKS5'])
/*const proxyType = ref([
  { label: 'SOCKS4', value: 'SOCKS4' },
  { label: 'SOCKS5', value: 'SOCKS5' },
])*/

const accountStatusType = ref([
  { label: 'Pasif', value: 0 },
  { label: 'Aktif', value: 1 },
])

onMounted(async () => {
  const result = await fetchAll()
  if (result.success) {
    proxyServerArray.value = result.response.data
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
  proxyServer.value = deletingItem
  deleteAccountDialog.value = true
}

const deleteAccountProxyServer = async () => {
  const result = await deleteOne(proxyServer.value.id)

  if (result.success) {
    proxyServerArray.value = proxyServerArray.value.filter(
      val => val.id !== proxyServer.value.id,
    )
  }

  deleteAccountDialog.value = false
  proxyServer.value = {}

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
  var selectedIds = selectedProxyServers.value.map(data => data.id)
  const result = await deleteBatch(selectedIds)

  if (result.success) {
    proxyServerArray.value = proxyServerArray.value.filter(
      val => !selectedProxyServers.value.includes(val),
    )
  }
  deleteAccountsDialog.value = false
  selectedProxyServers.value = []

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
  var selectedIds = selectedProxyServers.value.map(data => data.id)
  const result = await changeStatusAccounts(selectedIds, changedStatus.value)

  if (result.success) {
    proxyServerArray.value
      .filter(val => selectedProxyServers.value.includes(val))
      .forEach(element => {
        element.status = changedStatus.value
      })
  }

  changeStatusAccountsDialog.value = false
  selectedProxyServers.value = []

  MainUtil.showToast(
    toast,
    result.success ? 'success' : 'error',
    result.message,
  )
}

const openNew = () => {
  proxyServer.value = {}
  submitted.value = false
  proxyServerDialog.value = true
}

const hideDialog = () => {
  proxyServerDialog.value = false
  submitted.value = false
}

const save = async () => {
  submitted.value = true

  if (proxyServer.value.ip?.trim()) {
    var result
    console.log(proxyServer.value)
    proxyServer.value.status = proxyServer.value.status.value
    if (proxyServer.value.id) {
      result = await update(proxyServer.value)
      if (result.success) {
        proxyServerArray.value[
          findIndexById(result.response.data.proxyServerDto.id)
        ] = result.response.data.proxyServerDto
      }
    } else {
      result = await create([proxyServer.value])
      if (result.success) {
        result.response.data.proxyServerList.forEach(element => {
          proxyServerArray.value.push(element)
        })
      }
    }
    proxyServerDialog.value = false
    proxyServer.value = {}
    MainUtil.showToast(
      toast,
      result.success ? 'success' : 'error',
      result.message,
    )
  }
}

const findIndexById = id => {
  return proxyServerArray.value.findIndex(item => item.id === id)
}

const edit = editingProduct => {
  proxyServer.value = { ...editingProduct }
  accountStatusType.value.forEach(element => {
    if (proxyServer.value.status === element.value) {
      proxyServer.value.status = element
    }
  })
  proxyServerDialog.value = true
}

const onUpload = event => {
  const reader = new FileReader()
  reader.onload = async e => {
    var parsedData = MainUtil.parseCSV(e.target.result)
    const result = await create(parsedData)
    if (result.success) {
      result.response.data.proxyServerList.forEach(element => {
        proxyServerArray.value.push(element)
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
      v-model:selection="selectedProxyServers"
      :value="proxyServerArray"
      dataKey="id"
      :paginator="true"
      :rows="10"
      :filters="filters"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[5, 10, 25]"
      currentPageReportTemplate="{first} - {last} / {totalRecords} Ham Veri"
      filterDisplay="menu"
      :globalFilterFields="['ip', 'port', 'username']"
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
              :disabled="!selectedProxyServers.length"
            />

            <Button
              label="Çoklu Pasif"
              class="mr-2"
              @click="confirmChangeStatusSelected(0)"
              severity="info"
              :disabled="!selectedProxyServers.length"
            />
            <Button
              label="Çoklu Aktif"
              class="mr-2"
              severity="info"
              @click="confirmChangeStatusSelected(1)"
              :disabled="!selectedProxyServers.length"
            />
          </div>
          <h2 class="m-0">Proxy Server Listesi</h2>
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
      <Column field="ip" header="IP Adresi" class="i-column" />
      <Column field="port" header="Port" class="i-column" />
      <Column field="username" header="Kullanıcı Adı" class="i-column" />
      <Column field="password" header="Şifre" class="i-column" />
      <Column field="type" header="Tipi" class="i-column" />
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
        <span v-if="proxyServer"
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
      v-model:visible="proxyServerDialog"
      :style="{ width: '550px' }"
      header="Proxy Server Bilgisi"
      :modal="true"
    >
      <div class="w-full">
        <div class="field grid">
          <label class="col-3" for="ip"> IP Adresi </label>
          <div class="col-9">
            <InputText
              id="ip"
              v-model.trim="proxyServer.ip"
              required="true"
              autofocus
              :invalid="submitted && !proxyServer.ip"
              fluid
            />
          </div>
        </div>
        <div class="field grid">
          <label class="col-3" for="port"> Port </label>
          <div class="col-9">
            <InputText
              id="port"
              v-model.trim="proxyServer.port"
              required="true"
              :invalid="submitted && !proxyServer.port"
              fluid
            />
          </div>
        </div>
        <div class="field grid">
          <label class="col-3" for="username"> Kullanıcı Adı </label>
          <div class="col-9">
            <InputText
              id="username"
              v-model.trim="proxyServer.username"
              fluid
            />
          </div>
        </div>
        <div class="field grid">
          <label for="password" class="col-3">Şifre</label>
          <div class="col-9">
            <InputText id="target" v-model.trim="proxyServer.password" fluid />
          </div>
        </div>
        <div class="field grid">
          <label for="type" class="col-3">Tipi</label>
          <div class="col-9">
            <Select
              id="type"
              v-model="proxyServer.type"
              :options="proxyType"
              placeholder="Tipi"
              fluid
            ></Select>
          </div>
        </div>
        <div class="field grid">
          <label for="status" class="col-3">Durumu</label>
          <div class="col-9">
            <Select
              id="status"
              v-model="proxyServer.status"
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
        <span v-if="proxyServer"
          >İlgili kaydı silmeyi onaylıyor musunuz? Kullanıcı Adı:
          <b>{{ proxyServer.username }}</b></span
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
          @click="deleteAccountProxyServer"
        />
      </template>
    </Dialog>
  </div>
</template>

<style></style>
