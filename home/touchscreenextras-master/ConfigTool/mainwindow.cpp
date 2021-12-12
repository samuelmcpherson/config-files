/****************************************************************************
 **
 ** Copyright 2019 Piotr Grosiak     Kenlin.pl Polska
 **
 ** This file is part of TouchscreenExtras.
 **
 **  TouchscreenExtras is free software: you can redistribute it and/or modify
 **  it under the terms of the GNU General Public License as published by
 **  the Free Software Foundation, either version 3 of the License, or
 **  (at your option) any later version.
 **
 **  TouchscreenExtras is distributed in the hope that it will be useful,
 **  but WITHOUT ANY WARRANTY; without even the implied warranty of
 **  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 **  GNU General Public License for more details.
 **
 **  You should have received a copy of the GNU General Public License
 **  along with this program.  If not, see <http://www.gnu.org/licenses/>
 **
****************************************************************************/
#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "config.h"
#include "devreader.h"
#include <QVector>
#include <QFile>
#include <QTextStream>
#include <QInputDialog>

Config *cfg = new Config();
static QVector<QString> devName;
static QVector<int> devID;

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    // read device list from X server
    QProcess proc;
    proc.start("xinput");
    QString output;
    proc.waitForFinished(1000);
    while(!proc.atEnd())
    {
        output = QString(proc.readLine());
        if(output.contains("Virtual core pointer"))
        {
            output = QString(proc.readLine());
            while(!output.contains("Virtual core keyboard"))
            {
                devName.append(output.split("id=").at(0).right(output.split("id=").at(0).length() - 6));
                devID.append(output.split("id=").at(1).left(3).remove("[").toInt());
                QString test = output.split("id=").at(1).left(3).remove("[");
                ui->device->addItem("ID: " + QString::number(devID.last()) + "  " + devName.last(),devID.last());
                output = QString(proc.readLine());
            }
        }
    }

    // set last used device
    QFile file("RunTouchscreenExtras.sh");
    QString line;
    if ( file.open(QIODevice::ReadWrite) )
    {
        QTextStream str(&file);
        str.readLine();
        line = str.readLine();
    }
    file.close();
    int actDevID = line.split(" ").at(2).toInt();
    for(int i=0;i<devID.count();i++)
        if(actDevID == devID.at(i))
            ui->device->setCurrentIndex(i);


    devReader *devR = new devReader(ui->deviceOut,devTest);
    devR->start();


    ui->screenX->setValue(cfg->screenX);
    ui->ScreenY->setValue(cfg->screenY);

    ui->EdgeSizeX->setValue((cfg->edgeSizeX*100)/cfg->screenX);
    ui->EdgeSizeY->setValue((cfg->edgeSizeY*100)/cfg->screenY);
    ui->UseHoldForRNB->setChecked(cfg->holdForRMB);
    ui->pressTime->setValue(qreal(cfg->holdTime)/1000);
    ui->pressTolerance->setValue(cfg->holdTolerance);

    ui->TapAndMoveToScroll->setChecked(cfg->tapAndMove);
    ui->TapAndMoveTime->setValue(qreal(cfg->tapAndMoveTime)/1000);
    ui->TapAndMoveTolerance->setValue(cfg->tapAndMoveTolerance);
    ui->ScrollInterval->setValue(cfg->scrollInterval);

    ui->SwipeLenX->setValue((cfg->swipeDistanceX*100)/cfg->screenX);
    ui->SwipeLenY->setValue((cfg->swipeDistanceY*100)/cfg->screenY);
    ui->SwipeTolX->setValue((cfg->swipeToleranceX*1000)/cfg->screenX);
    ui->SwipeTolY->setValue((cfg->swipeToleranceY*1000)/cfg->screenY);
    ui->SwipeLeft->setChecked(cfg->swipeLeft);
    ui->SwipeRight->setChecked(cfg->swipeRight);
    ui->SwipeTop->setChecked(cfg->swipeTop);
    ui->SwipeBotton->setChecked(cfg->swipeBottom);
    ui->SwipeLeftCmd->setText(cfg->swipeLeftCmd);
    ui->SwipeRightCmd->setText(cfg->swipeRightCmd);
    ui->SwipeTopCmd->setText(cfg->swipeTopCmd);
    ui->SwipeBottomCmd->setText(cfg->swipeBottomCmd);

    ui->SlideLenX->setValue((cfg->slideDistanceX*100)/cfg->screenX);
    ui->SlideLenY->setValue((cfg->slideDistanceY*100)/cfg->screenY);
    ui->SlideTolX->setValue((cfg->slideToleranceX*1000)/cfg->screenX);
    ui->SlideTolY->setValue((cfg->slideToleranceY*1000)/cfg->screenY);
    ui->scrollArea->setValue((cfg->sliderSize*10000)/cfg->screenY);
    ui->slideTimeout->setValue((cfg->slideTimeout)/1000);
    ui->SlideLeft->setChecked(cfg->slideLeft);
    ui->SlideRight->setChecked(cfg->slideRight);
    ui->SlideTop->setChecked(cfg->slideTop);
    ui->SlideBottom->setChecked(cfg->slideBottom);
    ui->SlideLeftCmd->setText(cfg->slideLeftCmd);
    ui->SlideRightCmd->setText(cfg->slideRightCmd);
    ui->SlideTopCmd->setText(cfg->slideTopCmd);
    ui->SlideBottomCmd->setText(cfg->slideBottomCmd);

    ui->EdgeSizeIndicator->setGeometry(
                37+432*((cfg->edgeSizeX*100)/cfg->screenX)/100,36+206*((cfg->edgeSizeY*100)/cfg->screenY)/100,
                432-432*((cfg->edgeSizeX*100)/cfg->screenX)/100*2,206-206*((cfg->edgeSizeY*100)/cfg->screenY)/100*2);

    ui->swipe_left->setVisible(cfg->swipeLeft);
    ui->swipe_right->setVisible(cfg->swipeRight);
    ui->swipe_top->setVisible(cfg->swipeTop);
    ui->swipe_bottom->setVisible(cfg->swipeBottom);
    ui->slide_left->setVisible(cfg->slideLeft);
    ui->slide_right->setVisible(cfg->slideRight);
    ui->slide_top->setVisible(cfg->slideTop);
    ui->slide_bottom->setVisible(cfg->slideBottom);

    for(int i=0;i<cfg->blacklist.count();i++)
        ui->blacklist->addItem(cfg->blacklist.at(i));
}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::on_SlideLeft_toggled(bool checked)
{
    ui->slide_left->setVisible(checked);
    cfg->slideLeft = checked;
}

void MainWindow::on_SlideRight_toggled(bool checked)
{
    ui->slide_right->setVisible(checked);
    cfg->slideRight = checked;
}

void MainWindow::on_SlideTop_toggled(bool checked)
{
    ui->slide_top->setVisible(checked);
    cfg->slideTop = checked;
}

void MainWindow::on_SlideBottom_toggled(bool checked)
{
    ui->slide_bottom->setVisible(checked);
    cfg->slideBottom = checked;
}

void MainWindow::on_SwipeLeft_toggled(bool checked)
{
    ui->swipe_left->setVisible(checked);
    cfg->swipeLeft = checked;
}

void MainWindow::on_SwipeRight_toggled(bool checked)
{
    ui->swipe_right->setVisible(checked);
    cfg->swipeRight = checked;
}

void MainWindow::on_SwipeTop_toggled(bool checked)
{
    ui->swipe_top->setVisible(checked);
    cfg->swipeTop = checked;
}

void MainWindow::on_SwipeBotton_toggled(bool checked)
{
    ui->swipe_bottom->setVisible(checked);
    cfg->swipeBottom = checked;
}

void MainWindow::on_EdgeSizeX_sliderMoved(int position)
{
    cfg->edgeSizeX = cfg->screenX/100 * position;

    ui->EdgeSizeIndicator->setGeometry(
                37+432*((cfg->edgeSizeX*100)/cfg->screenX)/100,36+206*((cfg->edgeSizeY*100)/cfg->screenY)/100,
                432-432*((cfg->edgeSizeX*100)/cfg->screenX)/100*2,206-206*((cfg->edgeSizeY*100)/cfg->screenY)/100*2);

}

void MainWindow::on_EdgeSizeX_valueChanged(int value)
{
    cfg->edgeSizeX = cfg->screenX/100 * value;

    ui->EdgeSizeIndicator->setGeometry(
                37+432*((cfg->edgeSizeX*100)/cfg->screenX)/100,36+206*((cfg->edgeSizeY*100)/cfg->screenY)/100,
                432-432*((cfg->edgeSizeX*100)/cfg->screenX)/100*2,206-206*((cfg->edgeSizeY*100)/cfg->screenY)/100*2);
}

void MainWindow::on_EdgeSizeY_sliderMoved(int position)
{
    cfg->edgeSizeY = cfg->screenY/100 * position;

    ui->EdgeSizeIndicator->setGeometry(
                37+432*((cfg->edgeSizeX*100)/cfg->screenX)/100,36+206*((cfg->edgeSizeY*100)/cfg->screenY)/100,
                432-432*((cfg->edgeSizeX*100)/cfg->screenX)/100*2,206-206*((cfg->edgeSizeY*100)/cfg->screenY)/100*2);
}

void MainWindow::on_EdgeSizeY_valueChanged(int value)
{
    cfg->edgeSizeY = cfg->screenY/100 * value;

    ui->EdgeSizeIndicator->setGeometry(
                37+432*((cfg->edgeSizeX*100)/cfg->screenX)/100,36+206*((cfg->edgeSizeY*100)/cfg->screenY)/100,
                432-432*((cfg->edgeSizeX*100)/cfg->screenX)/100*2,206-206*((cfg->edgeSizeY*100)/cfg->screenY)/100*2);
}

void MainWindow::on_pressTime_valueChanged(double arg1)
{
    cfg->holdTime = int(arg1*1000);
}

void MainWindow::on_pressTolerance_valueChanged(int value)
{
    cfg->holdTolerance = value;
}

void MainWindow::on_SwipeLenX_valueChanged(int value)
{
    cfg->swipeDistanceX = cfg->screenX/100 * value;
}

void MainWindow::on_SwipeLenY_valueChanged(int value)
{
    cfg->swipeDistanceY = cfg->screenY/100 * value;
}

void MainWindow::on_SwipeTolX_valueChanged(int value)
{
    cfg->swipeToleranceX = cfg->screenY/1000 * value;
}

void MainWindow::on_SwipeTolY_valueChanged(int value)
{
    cfg->swipeToleranceY = cfg->screenX/1000 * value;
}

void MainWindow::on_SlideLenX_valueChanged(int value)
{
    cfg->slideDistanceX = cfg->screenY/100 * value;
}

void MainWindow::on_SlideLenY_valueChanged(int value)
{
    cfg->slideDistanceY = cfg->screenY/100 * value;
}

void MainWindow::on_SlideTolX_valueChanged(int value)
{
    cfg->slideToleranceX = cfg->screenY/1000 * value;
}

void MainWindow::on_SlideTolY_valueChanged(int value)
{
    cfg->slideToleranceY = cfg->screenX/1000 * value;
}

void MainWindow::on_scrollArea_valueChanged(int value)
{
    cfg->sliderSize = cfg->screenX/10000 * value;
}

void MainWindow::on_slideTimeout_valueChanged(double arg1)
{
    cfg->slideTimeout = int(arg1*1000);
}


void MainWindow::on_pushButton_clicked()
{
    QApplication::quit();
}

void MainWindow::on_buttonApply_clicked()
{
    cfg->swipeLeftCmd = ui->SwipeLeftCmd->text();
    cfg->swipeRightCmd = ui->SwipeRightCmd->text();
    cfg->swipeTopCmd = ui->SwipeTopCmd->text();
    cfg->swipeBottomCmd = ui->SwipeBottomCmd->text();
    cfg->slideLeftCmd = ui->SlideLeftCmd->text();
    cfg->slideRightCmd = ui->SlideRightCmd->text();
    cfg->slideTopCmd = ui->SlideTopCmd->text();
    cfg->slideBottomCmd = ui->SlideBottomCmd->text();

    cfg->Save();


    QFile file("RunTouchscreenExtras.sh");
    file.resize(0);
    if ( file.open(QIODevice::ReadWrite) )
    {
        QTextStream str(&file);
        str << "#!/usr/bin/env bash" << endl;
        str << "xinput -test " << devID.at(ui->device->currentIndex()) <<
               " | `dirname \"$0\"`/TouchscreenExtras" << endl;
    }
    file.close();

    on_restartSvr_clicked();
}

void MainWindow::on_pushButton_3_clicked()
{
    on_buttonApply_clicked();
    QApplication::quit();
}

void MainWindow::on_restartSvr_clicked()
{
    devTest->kill();
    devTest->waitForFinished(1000);
    QProcess proc;
    proc.start("pkill -f TouchscreenExtras");
    proc.waitForFinished(1000);
    proc.start("pkill -f xinput");
    proc.waitForFinished(1000);
    QProcess::startDetached("./RunTouchscreenExtras.sh &");
}

void MainWindow::on_device_currentIndexChanged(int index)
{
    //ui->deviceOut->setText(devName.at(index));
    devTest->kill();
    QProcess proc;
    proc.start("pkill -f TouchscreenExtras");
    proc.waitForFinished(1000);
    devTest->waitForFinished(1000);
    devTest->start("xinput -test " + QString::number(devID.at(index)));
}

void MainWindow::on_AutoScreenSize_toggled(bool checked)
{
    if(checked)
    {
        QProcess proc;
        proc.start("pkill -f TouchscreenExtras");
        proc.waitForFinished(1000);
        proc.start("pkill -f xinput");
        proc.waitForFinished(1000);
        maxX = 0;
        maxY = 0;
        regMax = true;
        devTest->start("xinput -test " + QString::number(devID.at(ui->device->currentIndex())));
    } else {
        regMax = false;
    }
}

void MainWindow::on_screenX_valueChanged(int arg1)
{
    cfg->screenX = arg1;
}

void MainWindow::on_ScreenY_valueChanged(int arg1)
{
    cfg->screenY = arg1;
}

void MainWindow::on_deviceOut_textChanged(const QString &arg1)
{
    if(!regMax) return;

    int x = 0;
    int y = 0;

    QStringList list = arg1.split(" ");
    foreach (QString item, list) {
        if(item.left(5) == "a[0]=")
            x = item.right(item.length()-5).toInt();
        if(item.left(5) == "a[1]=")
            y = item.right(item.length()-5).toInt();
    }

    if(x>maxX) maxX = x;
    if(y>maxY) maxY = y;

    ui->screenX->setValue(maxX);
    ui->ScreenY->setValue(maxY);

}

void MainWindow::on_addBlacklist_clicked()
{
    QString item = QInputDialog::getText(this,"Add blacklist entry","Window class:");
    if(item == "") return;
    ui->blacklist->addItem(item);
    cfg->blacklist.append(item);
}

void MainWindow::on_remBlacklist_clicked()
{
    if(ui->blacklist->currentItem() == nullptr) return;
    cfg->blacklist.removeAll(ui->blacklist->currentItem()->text());
    ui->blacklist->clear();
    for(int i=0;i<cfg->blacklist.count();i++)
        ui->blacklist->addItem(cfg->blacklist.at(i));
}

void MainWindow::on_TapAndMoveTolerance_valueChanged(int value)
{
    cfg->tapAndMoveTolerance = value;
}

void MainWindow::on_ScrollInterval_valueChanged(int value)
{
    cfg->scrollInterval = value;
}

void MainWindow::on_TapAndMoveTime_valueChanged(double arg1)
{
    cfg->tapAndMoveTime = int(arg1*1000);
}

void MainWindow::on_TapAndMoveToScroll_clicked(bool checked)
{
    cfg->tapAndMove = checked;
}
